import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationEntityType,
  NotificationType,
  User,
  UserRole,
  Event,
  Session,
  Attendance,
} from '@/database/entities';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private async getAdmins(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: UserRole.ADMIN, isActive: true },
      select: ['id', 'email', 'firstName', 'lastName', 'role'],
    });
  }

  private async getOrganizers(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: UserRole.ORGANIZER, isActive: true },
      select: ['id', 'email', 'firstName', 'lastName', 'role'],
    });
  }

  private async createForRecipients(
    recipients: User[],
    data: Omit<Notification, 'id' | 'recipient' | 'createdAt' | 'recipientId'>,
  ) {
    if (!recipients.length) return;
    const rows = recipients.map((recipient) =>
      this.notificationsRepository.create({
        ...data,
        recipientId: recipient.id,
      }),
    );
    await this.notificationsRepository.save(rows);
  }

  private buildEventMessage(event: Event) {
    const date = event.startDate
      ? new Date(event.startDate).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '—';
    return `${event.title} • ${date} • ${event.location ?? 'Lieu non renseigné'}`;
  }

  private buildSessionMessage(session: Session, event: Event) {
    const date = session.sessionDate
      ? new Date(session.sessionDate).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '—';
    return `${event.title} • ${session.label} • ${date}`;
  }

  async notifyEventCreated(event: Event, actor: User) {
    const recipients =
      actor.role === UserRole.ADMIN ? await this.getOrganizers() : await this.getAdmins();

    await this.createForRecipients(recipients, {
      actorId: actor.id,
      actorRole: actor.role,
      type: NotificationType.EVENT_CREATED,
      entityType: NotificationEntityType.EVENT,
      entityId: event.id,
      title: 'Événement créé',
      message: this.buildEventMessage(event),
      payload: {
        eventId: event.id,
        title: event.title,
        startDate: event.startDate,
        location: event.location,
        createdById: event.createdById,
      },
    });
  }

  async notifyEventCancelled(event: Event, actor: User) {
    const recipients =
      actor.role === UserRole.ADMIN ? await this.getOrganizers() : await this.getAdmins();

    await this.createForRecipients(recipients, {
      actorId: actor.id,
      actorRole: actor.role,
      type: NotificationType.EVENT_CANCELLED,
      entityType: NotificationEntityType.EVENT,
      entityId: event.id,
      title: 'Événement annulé',
      message: this.buildEventMessage(event),
      payload: {
        eventId: event.id,
        title: event.title,
        startDate: event.startDate,
        location: event.location,
        status: event.status,
      },
    });
  }

  async notifyEventDeleted(event: Event, actor: User) {
    const recipients =
      actor.role === UserRole.ADMIN ? await this.getOrganizers() : await this.getAdmins();

    await this.createForRecipients(recipients, {
      actorId: actor.id,
      actorRole: actor.role,
      type: NotificationType.EVENT_DELETED,
      entityType: NotificationEntityType.EVENT,
      entityId: event.id,
      title: 'Événement supprimé',
      message: this.buildEventMessage(event),
      payload: {
        eventId: event.id,
        title: event.title,
        startDate: event.startDate,
        location: event.location,
      },
    });
  }

  async notifySessionCancelled(session: Session, event: Event, actor: User) {
    const recipients =
      actor.role === UserRole.ADMIN ? await this.getOrganizers() : await this.getAdmins();

    await this.createForRecipients(recipients, {
      actorId: actor.id,
      actorRole: actor.role,
      type: NotificationType.SESSION_CANCELLED,
      entityType: NotificationEntityType.SESSION,
      entityId: session.id,
      title: 'Session annulée',
      message: this.buildSessionMessage(session, event),
      payload: {
        eventId: event.id,
        sessionId: session.id,
        label: session.label,
        sessionDate: session.sessionDate,
      },
    });
  }

  async notifyAttendanceDeleted(
    attendance: Attendance,
    event: Event,
    actor: User,
  ) {
    if (!event.createdById) return;
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Action réservée à l'administrateur");
    }

    const organizer = await this.usersRepository.findOne({
      where: { id: event.createdById, role: UserRole.ORGANIZER, isActive: true },
      select: ['id', 'email', 'firstName', 'lastName', 'role'],
    });

    if (!organizer) return;

    await this.createForRecipients([organizer], {
      actorId: actor.id,
      actorRole: actor.role,
      type: NotificationType.ATTENDANCE_DELETED,
      entityType: NotificationEntityType.ATTENDANCE,
      entityId: attendance.id,
      title: 'Pointage supprimé',
      message: this.buildEventMessage(event),
      payload: {
        eventId: event.id,
        sessionId: attendance.sessionId,
        participantId: attendance.participantId,
        checkInTime: attendance.checkInTime,
      },
    });
  }

  async listForUser(userId: string, params: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { recipientId: userId };
    if (params.unreadOnly) {
      where.readAt = null;
    }

    const [items, total] = await this.notificationsRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const unreadCount = await this.notificationsRepository.count({
      where: { recipientId: userId, readAt: null },
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  async markRead(userId: string, id: string) {
    const notification = await this.notificationsRepository.findOne({ where: { id } });
    if (!notification || notification.recipientId !== userId) {
      throw new ForbiddenException('Notification introuvable');
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await this.notificationsRepository.save(notification);
    }

    return notification;
  }

  async markAllRead(userId: string) {
    await this.notificationsRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ readAt: () => 'NOW()' })
      .where('recipient_id = :userId AND read_at IS NULL', { userId })
      .execute();
  }

  async remove(userId: string, id: string) {
    const notification = await this.notificationsRepository.findOne({ where: { id } });
    if (!notification || notification.recipientId !== userId) {
      throw new ForbiddenException('Notification introuvable');
    }

    await this.notificationsRepository.delete(id);
  }
}
