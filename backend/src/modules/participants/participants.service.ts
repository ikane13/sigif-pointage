// participants.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant } from '@/database/entities';
import { CreateParticipantDto, UpdateParticipantDto } from './dto';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
  ) {}

  /**
   * Créer un participant
   */
  async create(createParticipantDto: CreateParticipantDto): Promise<Participant> {
    const { cniNumber, email } = createParticipantDto;

    // Vérifier unicité CNI
    if (cniNumber) {
      const existingByCni = await this.participantRepository.findOne({
        where: { cniNumber },
      });

      if (existingByCni) {
        throw new ConflictException('Un participant avec ce numéro CNI existe déjà');
      }
    }

    // Vérifier unicité email (optionnel mais recommandé)
    if (email) {
      const existingByEmail = await this.participantRepository.findOne({
        where: { email },
      });

      if (existingByEmail) {
        throw new ConflictException('Un participant avec cet email existe déjà');
      }
    }

    const participant = this.participantRepository.create(createParticipantDto);
    await this.participantRepository.save(participant);

    return participant;
  }

  /**
   * Trouver un participant par CNI ou email (sans mise à jour)
   */
  async findByIdentity(participantData: CreateParticipantDto): Promise<Participant | null> {
    if (participantData.cniNumber) {
      const byCni = await this.participantRepository.findOne({
        where: { cniNumber: participantData.cniNumber },
      });
      if (byCni) return byCni;
    }

    if (participantData.email) {
      return this.participantRepository.findOne({
        where: { email: participantData.email },
      });
    }

    return null;
  }

  /**
   * Lookup public par CNI ou email (retourne un profil limité)
   */
  async lookupPublic(params: { cni?: string; email?: string }) {
    const cni = params.cni?.trim();
    const email = params.email?.trim();

    if (!cni && !email) {
      throw new BadRequestException('CNI ou email requis');
    }

    const participant = cni
      ? await this.participantRepository.findOne({ where: { cniNumber: cni } })
      : await this.participantRepository.findOne({ where: { email } });

    if (!participant) {
      throw new NotFoundException('Participant introuvable');
    }

    return {
      id: participant.id,
      firstName: participant.firstName,
      lastName: participant.lastName,
      function: participant.function,
      cniNumber: participant.cniNumber,
      originLocality: participant.originLocality,
      email: participant.email,
      phone: participant.phone,
      organization: participant.organization,
    };
  }

  /**
   * Trouver ou créer un participant (pour le pointage)
   *
   * RÈGLE STRICTE :
   * - CNI = Identifiant principal (unique et immuable)
   * - Email = Identifiant secondaire (unique mais peut changer)
   *
   * Logique :
   * 1. Chercher par CNI (prioritaire) → Si trouvé, mettre à jour les autres infos (y compris email)
   * 2. Chercher par email → Si trouvé AVEC CNI différent = ERREUR
   * 3. Créer nouveau si aucun match
   */
  async findOrCreate(participantData: CreateParticipantDto): Promise<Participant> {
    let participant: Participant | null = null;

    //  Chercher par CNI (identifiant PRINCIPAL)
    if (participantData.cniNumber) {
      participant = await this.participantRepository.findOne({
        where: { cniNumber: participantData.cniNumber },
      });

      if (participant) {
        console.log(`Participant trouvé par CNI: ${participant.id}`);

        // Mettre à jour TOUTES les infos (y compris email si changé)
        // Le CNI ne change jamais car on a trouvé par CNI
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { cniNumber, ...updates } = participantData;
        Object.assign(participant, updates);

        await this.participantRepository.save(participant);
        return participant;
      }

      console.log(`Aucun participant avec CNI: ${participantData.cniNumber}`);
    }

    //  Chercher par email (identifiant SECONDAIRE)
    if (participantData.email) {
      participant = await this.participantRepository.findOne({
        where: { email: participantData.email },
      });

      if (participant) {
        console.log(`Participant trouvé par email: ${participant.id}`);

        // RÈGLE STRICTE : Si un CNI est fourni et qu'il est différent → ERREUR
        if (participantData.cniNumber && participantData.cniNumber !== participant.cniNumber) {
          console.error(
            ` Conflit CNI/Email détecté:\n` +
              `   Email: ${participantData.email}\n` +
              `   CNI existant: ${participant.cniNumber}\n` +
              `   CNI fourni: ${participantData.cniNumber}`,
          );

          throw new ConflictException(
            `Un participant avec l'email ${participantData.email} existe déjà ` +
              `avec un numéro CNI différent (${participant.cniNumber}). ` +
              `Veuillez vérifier vos informations ou contacter l'administrateur.`,
          );
        }

        // Si pas de CNI fourni OU même CNI → Mettre à jour les autres infos
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { cniNumber, ...updates } = participantData;
        Object.assign(participant, updates);

        await this.participantRepository.save(participant);
        return participant;
      }

      console.log(`Aucun participant avec email: ${participantData.email}`);
    }

    //Aucun participant trouvé → Créer nouveau
    console.log(`Création d'un nouveau participant`);
    return this.create(participantData);
  }

  /**
   * Liste des participants avec filtres et pagination
   */
  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    organization?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ items: any[]; meta: any }> {
    const page = query.page ? parseInt(query.page.toString(), 10) : 1;
    const limit = query.limit ? parseInt(query.limit.toString(), 10) : 20;

    const { search, organization, sortBy = 'lastName', sortOrder = 'ASC' } = query;

    const skip = (page - 1) * limit;

    // ✅ Protection injection SQL
    const allowedSortFields = ['createdAt', 'firstName', 'lastName', 'organization', 'email'];

    if (!allowedSortFields.includes(sortBy)) {
      throw new BadRequestException(
        `Champ de tri invalide. Valeurs acceptées: ${allowedSortFields.join(', ')}`,
      );
    }

    if (!['ASC', 'DESC'].includes(sortOrder)) {
      throw new BadRequestException('Ordre de tri invalide. Valeurs acceptées: ASC, DESC');
    }

    // Construction requête
    const queryBuilder = this.participantRepository.createQueryBuilder('participant');

    // Filtres
    if (organization) {
      queryBuilder.andWhere('participant.organization ILIKE :organization', {
        organization: `%${organization}%`,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(participant.firstName ILIKE :search OR participant.lastName ILIKE :search OR participant.email ILIKE :search OR participant.organization ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Tri
    queryBuilder.orderBy(`participant.${sortBy}`, sortOrder);

    // Pagination
    queryBuilder.skip(skip).take(limit);

    const [participants, total] = await queryBuilder.getManyAndCount();

    // Ajouter les stats d'attendance pour chaque participant
    if (participants.length > 0) {
      const participantIds = participants.map((p) => p.id);

      const statsRaw = await this.participantRepository
        .createQueryBuilder('participant')
        .select('participant.id', 'participantId')
        .addSelect('COUNT(DISTINCT attendance.id)', 'attendanceCount')
        .addSelect('MAX(attendance.checkInTime)', 'lastAttendance')
        .leftJoin('participant.attendances', 'attendance')
        .where('participant.id IN (:...participantIds)', { participantIds })
        .groupBy('participant.id')
        .getRawMany();

      //  Map optimisée O(n)
      const statsMap = new Map(
        statsRaw.map((r) => [
          r.participantId,
          {
            attendanceCount: parseInt(r.attendanceCount || '0'),
            lastAttendance: r.lastAttendance ? new Date(r.lastAttendance) : null,
          },
        ]),
      );

      //  Construire les objets avec fullName explicite
      const items = participants.map((participant) => {
        const stats = statsMap.get(participant.id);
        return {
          id: participant.id,
          firstName: participant.firstName,
          lastName: participant.lastName,
          fullName: participant.fullName, //  Getter appelé explicitement
          function: participant.function,
          cniNumber: participant.cniNumber,
          originLocality: participant.originLocality,
          email: participant.email,
          phone: participant.phone,
          organization: participant.organization,
          createdAt: participant.createdAt,
          updatedAt: participant.updatedAt,
          attendanceCount: stats?.attendanceCount ?? 0,
          lastAttendance: stats?.lastAttendance ?? null,
        };
      });

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

    // Cas où aucun participant
    return {
      items: [],
      meta: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  /**
   * Récupérer un participant par ID
   */
  async findOne(id: string): Promise<any> {
    const participant = await this.participantRepository.findOne({
      where: { id },
      relations: ['attendances', 'attendances.event'],
    });

    if (!participant) {
      throw new NotFoundException('Participant introuvable');
    }

    // Calculer les stats
    const stats = {
      totalAttendances: participant.attendances?.length || 0,
      eventsTypes: this.calculateEventTypes(participant.attendances || []),
      lastAttendance: this.getLastAttendance(participant.attendances || []),
    };

    return {
      id: participant.id,
      firstName: participant.firstName,
      lastName: participant.lastName,
      fullName: participant.fullName, // ✅ Getter appelé explicitement
      function: participant.function,
      cniNumber: participant.cniNumber,
      originLocality: participant.originLocality,
      email: participant.email,
      phone: participant.phone,
      organization: participant.organization,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
      attendances: participant.attendances,
      stats,
    };
  }

  /**
   * Mettre à jour un participant
   */
  async update(id: string, updateParticipantDto: UpdateParticipantDto): Promise<Participant> {
    const participant = await this.participantRepository.findOne({
      where: { id },
    });

    if (!participant) {
      throw new NotFoundException('Participant introuvable');
    }

    // Vérifier unicité CNI si modifié
    if (
      updateParticipantDto.cniNumber &&
      updateParticipantDto.cniNumber !== participant.cniNumber
    ) {
      const existing = await this.participantRepository.findOne({
        where: { cniNumber: updateParticipantDto.cniNumber },
      });

      if (existing) {
        throw new ConflictException('Ce numéro CNI est déjà utilisé');
      }
    }

    // Vérifier unicité email si modifié
    if (updateParticipantDto.email && updateParticipantDto.email !== participant.email) {
      const existing = await this.participantRepository.findOne({
        where: { email: updateParticipantDto.email },
      });

      if (existing) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    Object.assign(participant, updateParticipantDto);
    await this.participantRepository.save(participant);

    return participant;
  }

  /**
   * Supprimer un participant
   */
  async remove(id: string): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { id },
    });

    if (!participant) {
      throw new NotFoundException('Participant introuvable');
    }

    await this.participantRepository.remove(participant);
  }

  /**
   * Calculer la répartition par type d'événement
   */
  private calculateEventTypes(attendances: any[]): Record<string, number> {
    const types: Record<string, number> = {};

    attendances.forEach((attendance) => {
      if (attendance.event?.eventType) {
        const type = attendance.event.eventType;
        types[type] = (types[type] || 0) + 1;
      }
    });

    return types;
  }

  /**
   * Récupérer la date de dernière présence
   */
  private getLastAttendance(attendances: any[]): string | null {
    if (attendances.length === 0) return null;

    const sorted = attendances.sort(
      (a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime(),
    );

    return sorted[0]?.checkInTime || null;
  }
}
