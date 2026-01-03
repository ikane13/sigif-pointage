import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance, CheckInMode, SignatureFormat } from '@/database/entities';
import { CreateAttendanceDto } from './dto';
import { ParticipantsService } from '../participants/participants.service';
import { EventsService } from '../events/events.service';
import { validateSignatureSize, extractImageFormat } from '@/utils/signature.util';
import { EventStatus } from '../../database/entities/event.entity';

@Injectable()
export class AttendancesService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    private participantsService: ParticipantsService,
    private eventsService: EventsService,
  ) {}

  /**
   * Créer une présence (pointage avec signature)
   */
  async create(
    createAttendanceDto: CreateAttendanceDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Attendance> {
    const { eventId, participant: participantData, signature, notes } = createAttendanceDto;

    // 1. Vérifier que l'événement existe et est actif
    const event = await this.eventsService.findOne(eventId);

    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException("Cet événement a été annulé. Contactez l'organisateur!");
    }

    if (event.status !== EventStatus.ONGOING) {
      throw new BadRequestException(
        "Le pointage n'est autorisé que lorsque l'événement est démarré. Contactez l'organisateur!",
      );
    }

    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    // 2. Trouver ou créer le participant
    const participant = await this.participantsService.findOrCreate(participantData);

    // 3. Vérifier que le participant n'a pas déjà pointé pour cet événement
    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        eventId,
        participantId: participant.id,
      },
    });

    if (existingAttendance) {
      throw new ConflictException('Vous avez déjà pointé pour cet événement');
    }

    // 4. Valider la taille de l'image décodée (max 100KB)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { imageBuffer, sizeKB } = validateSignatureSize(signature, 100);
    console.log(`Signature acceptée : ${sizeKB.toFixed(2)} KB`);

    // 5. Détecter le format de la signature
    const format = extractImageFormat(signature);
    const signatureFormat =
      format === 'jpeg' || format === 'jpg' ? SignatureFormat.JPG : SignatureFormat.PNG;

    // 6. Créer la présence
    const attendance = this.attendanceRepository.create({
      eventId,
      participantId: participant.id,
      checkInTime: new Date(),
      checkInMode: CheckInMode.QR_CODE,
      signatureData: signature,
      signatureFormat,
      ipAddress,
      userAgent,
      notes,
    });

    try {
      await this.attendanceRepository.save(attendance);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error.code, error.constraint);

      // Erreur PostgreSQL de violation de contrainte unique
      if (error.code === '23505' || error.constraint === 'uniq_attendance_event_participant') {
        throw new ConflictException('Vous avez déjà pointé pour cet événement');
      }

      // Autre erreur : relancer
      throw error;
    }

    // 7. Charger les relations pour la réponse
    return this.attendanceRepository.findOne({
      where: { id: attendance.id },
      relations: ['event', 'participant'],
    });

    // 7. Charger les relations pour la réponse
    return this.attendanceRepository.findOne({
      where: { id: attendance.id },
      relations: ['event', 'participant'],
    });
  }

  /**
   * Liste des présences avec filtres
   */
  async findAll(query: {
    page?: number;
    limit?: number;
    eventId?: string;
    participantId?: string;
    checkInFrom?: string;
    checkInTo?: string;
    hasSignature?: boolean;
    checkInMode?: CheckInMode;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ items: any[]; meta: any }> {
    const page = query.page ? parseInt(query.page.toString(), 10) : 1;
    const limit = query.limit ? parseInt(query.limit.toString(), 10) : 50;

    const {
      eventId,
      participantId,
      checkInFrom,
      checkInTo,
      hasSignature,
      checkInMode,
      sortBy = 'checkInTime',
      sortOrder = 'DESC',
    } = query;

    const skip = (page - 1) * limit;

    // ✅ Protection injection SQL
    const allowedSortFields = ['checkInTime', 'createdAt'];

    if (!allowedSortFields.includes(sortBy)) {
      throw new BadRequestException(
        `Champ de tri invalide. Valeurs acceptées: ${allowedSortFields.join(', ')}`,
      );
    }

    if (!['ASC', 'DESC'].includes(sortOrder)) {
      throw new BadRequestException('Ordre de tri invalide. Valeurs acceptées: ASC, DESC');
    }

    // Construction requête
    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.event', 'event')
      .leftJoinAndSelect('attendance.participant', 'participant')
      .leftJoinAndSelect('event.createdBy', 'createdBy');

    // Filtres
    if (eventId) {
      queryBuilder.andWhere('attendance.eventId = :eventId', { eventId });
    }

    if (participantId) {
      queryBuilder.andWhere('attendance.participantId = :participantId', { participantId });
    }

    if (checkInFrom && checkInTo) {
      queryBuilder.andWhere('attendance.checkInTime BETWEEN :checkInFrom AND :checkInTo', {
        checkInFrom: new Date(checkInFrom),
        checkInTo: new Date(checkInTo),
      });
    } else if (checkInFrom) {
      queryBuilder.andWhere('attendance.checkInTime >= :checkInFrom', {
        checkInFrom: new Date(checkInFrom),
      });
    } else if (checkInTo) {
      queryBuilder.andWhere('attendance.checkInTime <= :checkInTo', {
        checkInTo: new Date(checkInTo),
      });
    }

    if (hasSignature !== undefined) {
      if (hasSignature) {
        queryBuilder.andWhere('attendance.signatureData IS NOT NULL');
      } else {
        queryBuilder.andWhere('attendance.signatureData IS NULL');
      }
    }

    if (checkInMode) {
      queryBuilder.andWhere('attendance.checkInMode = :checkInMode', { checkInMode });
    }

    // Tri
    queryBuilder.orderBy(`attendance.${sortBy}`, sortOrder);

    // Pagination
    queryBuilder.skip(skip).take(limit);

    const [attendances, total] = await queryBuilder.getManyAndCount();

    // Formater les items
    const items = attendances.map((attendance) => ({
      id: attendance.id,
      event: {
        id: attendance.event.id,
        title: attendance.event.title,
        eventType: attendance.event.eventType,
        startDate: attendance.event.startDate,
      },
      participant: {
        id: attendance.participant.id,
        fullName: attendance.participant.fullName,
        function: attendance.participant.function,
        organization: attendance.participant.organization,
        email: attendance.participant.email,
        phone: attendance.participant.phone,
      },
      checkInTime: attendance.checkInTime,
      checkInMode: attendance.checkInMode,
      hasSignature: !!attendance.signatureData,
      signatureFormat: attendance.signatureFormat,
      ipAddress: attendance.ipAddress,
      notes: attendance.notes,
      createdAt: attendance.createdAt,
    }));

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Récupérer une présence par ID (avec signature)
   */
  async findOne(id: string): Promise<any> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
      relations: ['event', 'participant'],
    });

    if (!attendance) {
      throw new NotFoundException('Présence introuvable');
    }

    return {
      id: attendance.id,
      event: {
        id: attendance.event.id,
        title: attendance.event.title,
        eventType: attendance.event.eventType,
        startDate: attendance.event.startDate,
        location: attendance.event.location,
      },
      participant: {
        id: attendance.participant.id,
        fullName: attendance.participant.fullName,
        function: attendance.participant.function,
        cniNumber: attendance.participant.cniNumber,
        organization: attendance.participant.organization,
        email: attendance.participant.email,
        phone: attendance.participant.phone,
      },
      checkInTime: attendance.checkInTime,
      checkInMode: attendance.checkInMode,
      signatureData: attendance.signatureData,
      signatureFormat: attendance.signatureFormat,
      ipAddress: attendance.ipAddress,
      userAgent: attendance.userAgent,
      notes: attendance.notes,
      createdAt: attendance.createdAt,
      updatedAt: attendance.updatedAt,
    };
  }

  /**
   * Récupérer uniquement la signature
   */
  async getSignature(id: string): Promise<{ signatureData: string; signatureFormat: string }> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
      select: ['id', 'signatureData', 'signatureFormat'],
    });

    if (!attendance) {
      throw new NotFoundException('Présence introuvable');
    }

    if (!attendance.signatureData) {
      throw new NotFoundException('Aucune signature disponible pour cette présence');
    }

    return {
      signatureData: attendance.signatureData,
      signatureFormat: attendance.signatureFormat,
    };
  }

  /**
   * Supprimer une présence (admin uniquement)
   */
  async remove(id: string): Promise<void> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
    });

    if (!attendance) {
      throw new NotFoundException('Présence introuvable');
    }

    await this.attendanceRepository.remove(attendance);
  }

  /**
   * Liste des présences pour un événement spécifique
   */
  async findByEvent(
    eventId: string,
    query: {
      page?: number;
      limit?: number;
      hasSignature?: boolean;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ): Promise<{ event: any; items: any[]; meta: any; stats: any }> {
    // Vérifier que l'événement existe
    const event = await this.eventsService.findOne(eventId);

    // Récupérer les présences
    const result = await this.findAll({
      ...query,
      eventId,
    });

    // Calculer les stats
    const allAttendances = await this.attendanceRepository.find({
      where: { eventId },
    });

    const stats = {
      total: allAttendances.length,
      withSignature: allAttendances.filter((a) => a.signatureData).length,
      withoutSignature: allAttendances.filter((a) => !a.signatureData).length,
      signatureRate:
        allAttendances.length > 0
          ? (
              (allAttendances.filter((a) => a.signatureData).length / allAttendances.length) *
              100
            ).toFixed(2)
          : 0,
    };

    return {
      event: {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
      },
      items: result.items,
      meta: result.meta,
      stats,
    };
  }
}
