import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Certificate } from '@/database/entities/certificate.entity';
import { Attendance } from '@/database/entities/attendance.entity';
import { Participant } from '@/database/entities/participant.entity';
import {
  CreateCertificateDto,
  GenerateCertificatesDto,
  CertificateResponseDto,
} from './dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private certificateRepository: Repository<Certificate>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
  ) {}

  /**
   * Génère le prochain numéro de certificat unique
   */
  async generateCertificateNumber(): Promise<string> {
    const result = await this.certificateRepository.query(
      'SELECT generate_certificate_number() as number',
    );
    return result[0]?.number;
  }

  /**
   * Génère des certificats en masse pour plusieurs participants d'un événement
   */
  async generateBulkCertificates(
    eventId: string,
    generateDto: GenerateCertificatesDto,
    createdById: string,
  ): Promise<CertificateResponseDto[]> {
    const {
      participantIds,
      eventTitle,
      eventType,
      startDate,
      endDate,
      durationHours,
      location,
      organizer,
      trainer,
      issuedAt,
      signatoryName,
      signatoryRole,
      signatureImageUrl,
      conditionsMet,
    } = generateDto;

    // Vérifier que tous les participants existent
    const participants = await this.participantRepository.find({
      where: { id: In(participantIds) },
    });

    if (participants.length !== participantIds.length) {
      throw new BadRequestException('Certains participants sont introuvables');
    }

    // Vérifier les certificats existants
    const existingCertificates = await this.certificateRepository.find({
      where: {
        eventId,
        participantId: In(participantIds),
      },
    });

    const existingParticipantIds = new Set(
      existingCertificates.map((cert) => cert.participantId),
    );

    // Récupérer les attendances pour lier si disponibles
    const attendances = await this.attendanceRepository.find({
      where: {
        eventId,
        participantId: In(participantIds),
      },
    });

    const attendanceMap = new Map(
      attendances.map((att) => [att.participantId, att.id]),
    );

    const certificates: Certificate[] = [];

    // Créer les certificats pour les participants qui n'en ont pas encore
    for (const participantId of participantIds) {
      if (existingParticipantIds.has(participantId)) {
        // Si existe déjà, on garde l'existant pour la réimpression
        const existing = existingCertificates.find(
          (c) => c.participantId === participantId,
        );
        if (existing) {
          certificates.push(existing);
        }
        continue;
      }

      // Générer un nouveau certificat
      const certificateNumber = await this.generateCertificateNumber();

      const certificate = this.certificateRepository.create({
        eventId,
        participantId,
        attendanceId: attendanceMap.get(participantId) || null,
        certificateNumber,
        eventTitle,
        eventType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        durationHours,
        location,
        organizer,
        trainer,
        issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
        signatoryName,
        signatoryRole,
        signatureImageUrl,
        conditionsMet: conditionsMet ?? true,
        createdById,
      });

      const saved = await this.certificateRepository.save(certificate);
      certificates.push(saved);
    }

    // Charger les relations pour la réponse
    const certificatesWithRelations = await this.certificateRepository.find({
      where: {
        id: In(certificates.map((c) => c.id)),
      },
      relations: ['participant', 'event'],
    });

    return certificatesWithRelations.map((cert) =>
      plainToInstance(CertificateResponseDto, cert, {
        excludeExtraneousValues: true,
      }),
    );
  }

  /**
   * Créer un certificat individuel
   */
  async create(
    eventId: string,
    createDto: CreateCertificateDto,
    createdById: string,
  ): Promise<CertificateResponseDto> {
    const { participantId } = createDto;

    // Vérifier si un certificat existe déjà
    const existing = await this.certificateRepository.findOne({
      where: { eventId, participantId },
    });

    if (existing) {
      throw new ConflictException(
        'Un certificat existe déjà pour ce participant',
      );
    }

    // Vérifier que le participant existe
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
    });

    if (!participant) {
      throw new NotFoundException('Participant introuvable');
    }

    const certificateNumber = await this.generateCertificateNumber();

    const certificate = this.certificateRepository.create({
      eventId,
      ...createDto,
      certificateNumber,
      startDate: new Date(createDto.startDate),
      endDate: createDto.endDate ? new Date(createDto.endDate) : null,
      issuedAt: createDto.issuedAt
        ? new Date(createDto.issuedAt)
        : new Date(),
      conditionsMet: createDto.conditionsMet ?? true,
      createdById,
    });

    const saved = await this.certificateRepository.save(certificate);

    const withRelations = await this.certificateRepository.findOne({
      where: { id: saved.id },
      relations: ['participant', 'event'],
    });

    return plainToInstance(CertificateResponseDto, withRelations, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Récupérer tous les certificats d'un événement
   */
  async findByEvent(eventId: string): Promise<CertificateResponseDto[]> {
    const certificates = await this.certificateRepository.find({
      where: { eventId },
      relations: ['participant', 'event'],
      order: { issuedAt: 'DESC' },
    });

    return certificates.map((cert) =>
      plainToInstance(CertificateResponseDto, cert, {
        excludeExtraneousValues: true,
      }),
    );
  }

  /**
   * Récupérer un certificat par son ID
   */
  async findOne(id: string): Promise<CertificateResponseDto> {
    const certificate = await this.certificateRepository.findOne({
      where: { id },
      relations: ['participant', 'event'],
    });

    if (!certificate) {
      throw new NotFoundException('Certificat introuvable');
    }

    return plainToInstance(CertificateResponseDto, certificate, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Récupérer les certificats d'un participant
   */
  async findByParticipant(
    participantId: string,
  ): Promise<CertificateResponseDto[]> {
    const certificates = await this.certificateRepository.find({
      where: { participantId },
      relations: ['participant', 'event'],
      order: { issuedAt: 'DESC' },
    });

    return certificates.map((cert) =>
      plainToInstance(CertificateResponseDto, cert, {
        excludeExtraneousValues: true,
      }),
    );
  }

  /**
   * Vérifier si un participant a déjà un certificat pour un événement
   */
  async hasCertificate(
    eventId: string,
    participantId: string,
  ): Promise<boolean> {
    const count = await this.certificateRepository.count({
      where: { eventId, participantId },
    });

    return count > 0;
  }

  /**
   * Récupérer le certificat d'un participant pour un événement
   */
  async findByEventAndParticipant(
    eventId: string,
    participantId: string,
  ): Promise<CertificateResponseDto | null> {
    const certificate = await this.certificateRepository.findOne({
      where: { eventId, participantId },
      relations: ['participant', 'event'],
    });

    if (!certificate) {
      return null;
    }

    return plainToInstance(CertificateResponseDto, certificate, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Supprimer un certificat
   */
  async remove(id: string): Promise<void> {
    const certificate = await this.certificateRepository.findOne({
      where: { id },
    });

    if (!certificate) {
      throw new NotFoundException('Certificat introuvable');
    }

    await this.certificateRepository.remove(certificate);
  }
}
