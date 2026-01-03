import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Event, EventStatus, EventType } from '@/database/entities';
import { CreateEventDto, UpdateEventDto } from './dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private configService: ConfigService,
  ) {}

  private assertEventNotLocked(event: Event) {
    if (event.status === EventStatus.COMPLETED || event.status === EventStatus.CANCELLED) {
      throw new BadRequestException("Action interdite : l'événement est terminé ou annulé");
    }
  }

  /**
   * Créer un événement (version corrigée: plus de logique QR Code ici)
   */
  async create(createEventDto: CreateEventDto, userId: string): Promise<Event> {
    const { startDate, endDate, ...rest } = createEventDto;

    // Valider que endDate >= startDate
    if (endDate && new Date(endDate) < new Date(startDate)) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début');
    }

    // Créer l'événement (QR code généré plus tard via QrCodesService)
    const event = this.eventRepository.create({
      ...rest,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status: EventStatus.SCHEDULED,
      createdById: userId,
    });

    return await this.eventRepository.save(event);
  }

  /**
   * Récupérer tous les événements (avec pagination et filtres)
   */
  async findAll(query: {
    page?: number;
    limit?: number;
    status?: EventStatus | EventStatus[];
    eventType?: EventType | EventType[];
    startDateFrom?: string;
    startDateTo?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ items: any[]; meta: any }> {
    const page = query.page ? parseInt(query.page.toString(), 10) : 1;
    const limit = query.limit ? parseInt(query.limit.toString(), 10) : 20;
    const {
      status,
      eventType,
      startDateFrom,
      startDateTo,
      search,
      sortBy = 'startDate',
      sortOrder = 'DESC',
    } = query;

    const skip = (page - 1) * limit;

    // Protection contre l'injection SQL
    const allowedSortFields = ['createdAt', 'startDate', 'endDate', 'title', 'status', 'eventType'];

    if (!allowedSortFields.includes(sortBy)) {
      throw new BadRequestException(
        `Champ de tri invalide. Valeurs acceptées: ${allowedSortFields.join(', ')}`,
      );
    }

    if (!['ASC', 'DESC'].includes(sortOrder)) {
      throw new BadRequestException('Ordre de tri invalide. Valeurs acceptées: ASC, DESC');
    }

    // Construction de la requête principale
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.createdBy', 'createdBy');

    // Filtres
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      queryBuilder.andWhere('event.status IN (:...statuses)', { statuses });
    }

    if (eventType) {
      const eventTypes = Array.isArray(eventType) ? eventType : [eventType];
      queryBuilder.andWhere('event.eventType IN (:...eventTypes)', { eventTypes });
    }

    if (startDateFrom && startDateTo) {
      queryBuilder.andWhere('event.startDate BETWEEN :startDateFrom AND :startDateTo', {
        startDateFrom: new Date(startDateFrom),
        startDateTo: new Date(startDateTo),
      });
    } else if (startDateFrom) {
      queryBuilder.andWhere('event.startDate >= :startDateFrom', {
        startDateFrom: new Date(startDateFrom),
      });
    } else if (startDateTo) {
      queryBuilder.andWhere('event.startDate <= :startDateTo', {
        startDateTo: new Date(startDateTo),
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(event.title ILIKE :search OR event.description ILIKE :search OR event.location ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Tri Sécurisé
    queryBuilder.orderBy(`event.${sortBy}`, sortOrder);

    // Pagination
    queryBuilder.skip(skip).take(limit);

    // Récupérer les événements
    const [events, total] = await queryBuilder.getManyAndCount();

    // Récupérer les counts d'attendances pour chaque événement (en une seule requête)
    const eventIds = events.map((e) => e.id);

    let attendanceCounts: { eventId: string; count: number }[] = [];

    if (eventIds.length > 0) {
      const countsRaw = await this.eventRepository
        .createQueryBuilder('event')
        .select('event.id', 'eventId')
        .addSelect('COUNT(attendance.id)', 'count')
        .leftJoin('event.attendances', 'attendance')
        .where('event.id IN (:...eventIds)', { eventIds })
        .groupBy('event.id')
        .getRawMany();

      attendanceCounts = countsRaw.map((r) => ({
        eventId: r.eventId,
        count: parseInt(r.count || '0'),
      }));
    }

    const countMap = new Map(attendanceCounts.map((c) => [c.eventId, c.count]));

    const items = events.map((event) => ({
      ...event,
      attendanceCount: countMap.get(event.id) ?? 0,
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
   * Récupérer un événement par ID
   */
  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['createdBy', 'attendances'],
    });

    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    // Calculer les stats
    const stats = {
      total: event.attendances?.length || 0,
      withSignature: event.attendances?.filter((a) => a.signatureData).length || 0,
      withoutSignature: event.attendances?.filter((a) => !a.signatureData).length || 0,
    };

    (event as any).attendanceStats = stats;

    return event;
  }

  /**
   * Mettre à jour un événement
   */
  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    this.assertEventNotLocked(event);
    // Valider les dates si modifiées
    if (updateEventDto.startDate || updateEventDto.endDate) {
      const newStartDate = updateEventDto.startDate
        ? new Date(updateEventDto.startDate)
        : event.startDate;
      const newEndDate = updateEventDto.endDate ? new Date(updateEventDto.endDate) : event.endDate;

      if (newEndDate && newEndDate < newStartDate) {
        throw new BadRequestException('La date de fin doit être postérieure à la date de début');
      }
    }

    // Mettre à jour
    Object.assign(event, updateEventDto);

    if (updateEventDto.startDate) {
      event.startDate = new Date(updateEventDto.startDate);
    }

    if (updateEventDto.endDate) {
      event.endDate = new Date(updateEventDto.endDate);
    }

    await this.eventRepository.save(event);

    return event;
  }

  /**
   * Supprimer un événement
   */
  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    this.assertEventNotLocked(event);
    await this.eventRepository.remove(event);
  }

  async updateStatus(id: string, dto: UpdateEventStatusDto) {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Événement introuvable');

    const next = dto.status;
    const current = event.status;

    // Transitions autorisées (Option B)
    const allowed: Record<EventStatus, EventStatus[]> = {
      [EventStatus.SCHEDULED]: [EventStatus.ONGOING, EventStatus.CANCELLED],
      [EventStatus.ONGOING]: [EventStatus.COMPLETED, EventStatus.CANCELLED],
      [EventStatus.COMPLETED]: [],
      [EventStatus.CANCELLED]: [],
    };

    if (!allowed[current].includes(next)) {
      throw new BadRequestException(`Transition de statut non autorisée (${current} -> ${next})`);
    }

    event.status = next;
    return this.eventRepository.save(event);
  }
}
