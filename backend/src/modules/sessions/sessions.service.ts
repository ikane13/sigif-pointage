import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Session, SessionStatus, EventStatus, User } from '@/database/entities';
import { CreateSessionDto, UpdateSessionDto } from './dto';
import { EventsService } from '../events/events.service';
import { UpdateSessionStatusDto } from './dto/update-session-status.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    private eventsService: EventsService,
    private notificationsService: NotificationsService,
  ) {}

  private async recomputeEventStatus(eventId: string): Promise<void> {
    await this.eventsService.recomputeStatusFromSessions(eventId);
  }

  private assertSessionNotLocked(session: Session) {
    if (session.status === SessionStatus.COMPLETED || session.status === SessionStatus.CANCELLED) {
      throw new BadRequestException('Action interdite : la session est terminée ou annulée');
    }
  }

  private assertEventNotLocked(eventStatus: EventStatus) {
    if (eventStatus === EventStatus.COMPLETED || eventStatus === EventStatus.CANCELLED) {
      throw new BadRequestException("Action interdite : l'événement est terminé ou annulé");
    }
  }

  private isHHMM(value: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  private hhmmToMinutes(value: string): number {
    const [h, m] = value.split(':');
    return Number(h) * 60 + Number(m);
  }

  private assertTimeConsistency(startTime?: string, endTime?: string) {
    if (!startTime && !endTime) return;

    if (startTime && !this.isHHMM(startTime)) {
      throw new BadRequestException('startTime invalide. Format attendu HH:MM');
    }

    if (endTime && !this.isHHMM(endTime)) {
      throw new BadRequestException('endTime invalide. Format attendu HH:MM');
    }

    if (startTime && endTime) {
      const start = this.hhmmToMinutes(startTime);
      const end = this.hhmmToMinutes(endTime);

      if (end <= start) {
        throw new BadRequestException('endTime doit être strictement supérieur à startTime');
      }
    }
  }

  /**
   * Créer une session rattachée à un événement
   */
  async create(eventId: string, dto: CreateSessionDto, user: User): Promise<Session> {
    const event = await this.eventsService.findOne(eventId);
    if (!event) throw new NotFoundException('Événement introuvable');
    this.eventsService.assertUserCanManageEvent(event, user);

    this.assertEventNotLocked(event.status);
    this.assertTimeConsistency(dto.startTime, dto.endTime);

    // Unicité : (eventId, sessionNumber)
    const existing = await this.sessionRepository.findOne({
      where: { eventId, sessionNumber: dto.sessionNumber },
    });

    if (existing) {
      throw new ConflictException(
        `Une session #${dto.sessionNumber} existe déjà pour cet événement`,
      );
    }

    const session = this.sessionRepository.create({
      eventId,
      sessionNumber: dto.sessionNumber,
      sessionDate: new Date(dto.sessionDate) as any, // "YYYY-MM-DD" -> Date
      label: dto.label,
      title: dto.title ?? null,
      startTime: dto.startTime,
      endTime: dto.endTime,
      location: dto.location,
      status: SessionStatus.SCHEDULED,
    });

    return await this.sessionRepository.save(session);
  }

  /**
   * Liste des sessions d’un événement
   */
  async findAllByEvent(eventId: string): Promise<Session[]> {
    const event = await this.eventsService.findOne(eventId);
    if (!event) throw new NotFoundException('Événement introuvable');

    return this.sessionRepository
      .createQueryBuilder('session')
      .where('session.eventId = :eventId', { eventId })
      .loadRelationCountAndMap('session.attendanceCount', 'session.attendances')
      .orderBy('session.sessionDate', 'ASC')
      .addOrderBy('session.sessionNumber', 'ASC')
      .getMany();
  }

  /**
   * Détails d’une session
   */
  async findOne(id: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({ where: { id } });

    if (!session) {
      throw new NotFoundException('Session introuvable');
    }

    return session;
  }

  /**
   * Mettre à jour une session
   */
  async update(id: string, dto: UpdateSessionDto, user: User): Promise<Session> {
    const session = await this.findOne(id);
    this.assertSessionNotLocked(session);
    const event = await this.eventsService.findOne(session.eventId);
    this.eventsService.assertUserCanManageEvent(event, user);

    const nextStart = dto.startTime ?? session.startTime;
    const nextEnd = dto.endTime ?? session.endTime;
    this.assertTimeConsistency(nextStart, nextEnd);

    // Unicité si changement de numéro
    if (dto.sessionNumber !== undefined && dto.sessionNumber !== session.sessionNumber) {
      const existing = await this.sessionRepository.findOne({
        where: { eventId: session.eventId, sessionNumber: dto.sessionNumber },
      });

      if (existing) {
        throw new ConflictException(
          `Une session #${dto.sessionNumber} existe déjà pour cet événement`,
        );
      }
    }

    // Mise à jour
    Object.assign(session, dto);

    if (dto.sessionDate !== undefined) {
      session.sessionDate = new Date(dto.sessionDate) as any;
    }

    return await this.sessionRepository.save(session);
  }

  /**
   * Supprimer une session
   */
  async remove(id: string): Promise<void> {
    const session = await this.findOne(id);
    this.assertSessionNotLocked(session);

    const eventId = session.eventId;

    await this.sessionRepository.remove(session);

    await this.eventsService.recomputeStatusFromSessions(eventId);
  }

  /**
   * Mettre à jour le statut (transitions contrôlées)
   */
  async updateStatus(id: string, dto: UpdateSessionStatusDto, user: User): Promise<Session> {
    const session = await this.sessionRepository.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Session introuvable');
    const event = await this.eventsService.findOne(session.eventId);
    this.eventsService.assertUserCanManageEvent(event, user);

    const next = dto.status;
    const current = session.status;

    const allowed: Record<SessionStatus, SessionStatus[]> = {
      [SessionStatus.SCHEDULED]: [SessionStatus.ONGOING, SessionStatus.CANCELLED],
      [SessionStatus.ONGOING]: [SessionStatus.COMPLETED, SessionStatus.CANCELLED],
      [SessionStatus.COMPLETED]: [],
      [SessionStatus.CANCELLED]: [],
    };

    if (!allowed[current].includes(next)) {
      throw new BadRequestException(`Transition de statut non autorisée (${current} -> ${next})`);
    }

    session.status = next;
    const saved = await this.sessionRepository.save(session);
    // Recalculer le statut global de l'événement
    await this.recomputeEventStatus(saved.eventId);

    if (next === SessionStatus.CANCELLED && current !== SessionStatus.CANCELLED) {
      await this.notificationsService.notifySessionCancelled(saved, event, user);
    }
    return saved;
  }
  /**
   * Générer automatiquement des sessions en fonction du nbre de Jrs de Events
   */
  async generateDailySessions(
    eventId: string,
    user: User,
  ): Promise<{
    created: number;
    skipped: number;
    totalDays: number;
  }> {
    const event = await this.eventsService.findOne(eventId);
    if (!event) throw new NotFoundException('Événement introuvable');
    this.eventsService.assertUserCanManageEvent(event, user);

    // Bloquer si event terminé/annulé
    this.assertEventNotLocked(event.status);

    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : new Date(event.startDate);

    // Normaliser à minuit (évite bugs TZ)
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début');
    }

    // Charger sessions existantes (pour éviter doublons)
    const existing = await this.sessionRepository.find({
      where: { eventId },
      order: { sessionDate: 'ASC', sessionNumber: 'ASC' },
    });

    const existingDates = new Set(
      existing.map((s) => new Date(s.sessionDate).toISOString().slice(0, 10)),
    );

    let created = 0;
    let skipped = 0;

    // Déterminer le prochain sessionNumber (si sessions déjà créées)
    let nextNumber =
      existing.length > 0 ? Math.max(...existing.map((s) => s.sessionNumber)) + 1 : 1;

    const cursor = new Date(start);
    let totalDays = 0;

    while (cursor <= end) {
      totalDays += 1;
      const ymd = cursor.toISOString().slice(0, 10); // YYYY-MM-DD

      if (existingDates.has(ymd)) {
        skipped += 1;
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }

      const session = this.sessionRepository.create({
        eventId,
        sessionNumber: nextNumber,
        sessionDate: new Date(ymd) as any, // date only
        label: `Session du ${ymd}`, // ✅ ton choix
        title: null, // ✅ nom explicite optionnel
        location: event.location ?? null,
        status: SessionStatus.SCHEDULED,
      });

      await this.sessionRepository.save(session);

      created += 1;
      nextNumber += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
    await this.recomputeEventStatus(eventId);
    return { created, skipped, totalDays };
  }
}
