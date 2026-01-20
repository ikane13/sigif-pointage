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
import { SessionsService } from '../sessions/sessions.service';
import { SessionStatus } from '@/database/entities';
import * as ExcelJS from 'exceljs';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '@/database/entities';

@Injectable()
export class AttendancesService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    private participantsService: ParticipantsService,
    private eventsService: EventsService,
    private sessionsService: SessionsService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Créer une présence (pointage avec signature)
   */
  async create(
    createAttendanceDto: CreateAttendanceDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Attendance> {
    const {
      eventId,
      sessionId,
      participant: participantData,
      signature,
      notes,
    } = createAttendanceDto;

    // 1) Vérifier event (on ne bloque QUE si annulé par admin)
    const event = await this.eventsService.findOne(eventId);
    if (!event) throw new NotFoundException('Événement introuvable');

    // Override admin = blocage total
    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException("Cet événement a été annulé. Contactez l'organisateur!");
    }

    // 2) Session obligatoire + cohérence event/session
    if (!sessionId) {
      throw new BadRequestException("L'ID de la session est requis");
    }

    const session = await this.sessionsService.findOne(sessionId);

    if (session.eventId !== eventId) {
      throw new BadRequestException("La session ne correspond pas à l'événement fourni");
    }

    // La règle métier de pointage = session en cours
    if (session.status !== SessionStatus.ONGOING) {
      const msg =
        session.status === SessionStatus.CANCELLED
          ? 'Cette session a été annulée. Contactez l’organisateur!'
          : session.status === SessionStatus.COMPLETED
            ? 'Cette session est terminée. Le pointage est clos.'
            : "Le pointage n'est autorisé que lorsque la session est démarrée. Contactez l'organisateur!";
      throw new BadRequestException(msg);
    }

    // (Optionnel mais cohérent) : si ton recompute est asynchrone, on ne bloque pas.
    // Si tu veux garder une cohérence, tu peux juste déclencher un recompute best-effort :
    // await this.eventsService.recomputeStatusFromSessions(eventId);

    // 3) Trouver ou créer le participant
    const participant = await this.participantsService.findOrCreate(participantData);

    // 4) Unicité : participant + session
    const existingAttendance = await this.attendanceRepository.findOne({
      where: { participantId: participant.id, sessionId: session.id },
    });
    if (existingAttendance) {
      throw new ConflictException('Vous avez déjà pointé pour cette session');
    }

    // 5) Signature (100KB max)
    const { sizeKB } = validateSignatureSize(signature, 100);
    console.log(`Signature acceptée : ${sizeKB.toFixed(2)} KB`);

    // 6) Format signature
    const format = extractImageFormat(signature);
    const signatureFormat =
      format === 'jpeg' || format === 'jpg' ? SignatureFormat.JPG : SignatureFormat.PNG;

    // 7) Create attendance
    const attendance = this.attendanceRepository.create({
      eventId,
      sessionId: session.id,
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
      if (error?.code === '23505') {
        throw new ConflictException('Vous avez déjà pointé pour cette session');
      }
      throw error;
    }

    // 8) Return relations
    return this.attendanceRepository.findOne({
      where: { id: attendance.id },
      relations: ['event', 'participant', 'session'],
    });
  }

  /**
   * Liste des présences avec filtres
   */
  async findAll(query: {
    page?: number;
    limit?: number;
    eventId?: string;
    sessionId?: string; // ✅ AJOUT
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
      sessionId, // ✅ AJOUT
      participantId,
      checkInFrom,
      checkInTo,
      hasSignature,
      checkInMode,
      sortBy = 'checkInTime',
      sortOrder = 'DESC',
    } = query;

    const skip = (page - 1) * limit;

    const allowedSortFields = ['checkInTime', 'createdAt'];
    if (!allowedSortFields.includes(sortBy)) {
      throw new BadRequestException(
        `Champ de tri invalide. Valeurs acceptées: ${allowedSortFields.join(', ')}`,
      );
    }

    if (!['ASC', 'DESC'].includes(sortOrder)) {
      throw new BadRequestException('Ordre de tri invalide. Valeurs acceptées: ASC, DESC');
    }

    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.event', 'event')
      .leftJoinAndSelect('attendance.session', 'session') // ✅ AJOUT
      .leftJoinAndSelect('attendance.participant', 'participant')
      .leftJoinAndSelect('event.createdBy', 'createdBy');

    // Filtres
    if (eventId) {
      queryBuilder.andWhere('attendance.eventId = :eventId', { eventId });
    }

    if (sessionId) {
      queryBuilder.andWhere('attendance.sessionId = :sessionId', { sessionId });
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
      if (hasSignature) queryBuilder.andWhere('attendance.signatureData IS NOT NULL');
      else queryBuilder.andWhere('attendance.signatureData IS NULL');
    }

    if (checkInMode) {
      queryBuilder.andWhere('attendance.checkInMode = :checkInMode', { checkInMode });
    }

    // Tri + pagination
    queryBuilder.orderBy(`attendance.${sortBy}`, sortOrder);
    queryBuilder.skip(skip).take(limit);

    const [attendances, total] = await queryBuilder.getManyAndCount();

    const items = attendances.map((attendance) => ({
      id: attendance.id,
      event: {
        id: attendance.event.id,
        title: attendance.event.title,
        eventType: attendance.event.eventType,
        startDate: attendance.event.startDate,
        organizer: attendance.event.organizer,
      },
      session: {
        id: attendance.session.id,
        sessionNumber: attendance.session.sessionNumber,
        sessionDate: attendance.session.sessionDate,
        label: attendance.session.label,
        title: attendance.session.title ?? null,
        status: attendance.session.status,
        startTime: attendance.session.startTime,
        endTime: attendance.session.endTime,
        location: attendance.session.location,
      },
      participant: {
        id: attendance.participant.id,
        fullName: attendance.participant.fullName,
        function: attendance.participant.function,
        cniNumber: attendance.participant.cniNumber,
        originLocality: attendance.participant.originLocality,
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
      relations: ['event', 'participant', 'session'], // ✅ AJOUT session
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
        organizer: attendance.event.organizer,
      },
      session: {
        id: attendance.session.id,
        sessionNumber: attendance.session.sessionNumber,
        sessionDate: attendance.session.sessionDate,
        label: attendance.session.label,
        title: attendance.session.title ?? null,
        status: attendance.session.status,
        startTime: attendance.session.startTime,
        endTime: attendance.session.endTime,
        location: attendance.session.location,
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
  async remove(id: string, actor: User): Promise<void> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
    });

    if (!attendance) {
      throw new NotFoundException('Présence introuvable');
    }

    const event = await this.eventsService.findOne(attendance.eventId);

    await this.attendanceRepository.remove(attendance);

    await this.notificationsService.notifyAttendanceDeleted(attendance, event, actor);
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
      sessionId?: string; // ✅ AJOUT
    },
  ): Promise<{ event: any; items: any[]; meta: any; stats: any }> {
    const event = await this.eventsService.findOne(eventId);

    const result = await this.findAll({
      ...query,
      eventId,
    });

    const whereStats: any = { eventId };
    if (query.sessionId) whereStats.sessionId = query.sessionId;

    const allAttendances = await this.attendanceRepository.find({
      where: whereStats,
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
        eventType: event.eventType,
        startDate: event.startDate,
        endDate: event.endDate ?? null,
        location: event.location,
        organizer: event.organizer ?? null,
        status: event.status,
      },
      items: result.items,
      meta: result.meta,
      stats,
    };
  }

  async findBySession(
    sessionId: string,
    query: {
      page?: number;
      limit?: number;
      hasSignature?: boolean;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ): Promise<{ session: any; event: any; items: any[]; meta: any; stats: any }> {
    const session = await this.sessionsService.findOne(sessionId);
    const event = await this.eventsService.findOne(session.eventId);

    const result = await this.findAll({
      ...query,
      sessionId,
      eventId: session.eventId,
    } as any);

    const allAttendances = await this.attendanceRepository.find({
      where: { sessionId },
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
      event: { id: session.eventId, organizer: event?.organizer },
      session: {
        id: session.id,
        sessionNumber: session.sessionNumber,
        sessionDate: session.sessionDate,
        label: session.label,
        title: session.title ?? null,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        location: session.location,
      },
      items: result.items,
      meta: result.meta,
      stats,
    };
  }

  /* async exportSessionAttendancesXlsx(
    sessionId: string,
    query: {
      hasSignature?: boolean;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ): Promise<Buffer> {
    // On récupère TOUTES les présences (sans pagination)
    const result = await this.findAll({
      sessionId,
      eventId: undefined,
      page: 1,
      limit: 100000, // suffisamment grand
      hasSignature: query.hasSignature,
      sortBy: query.sortBy ?? 'checkInTime',
      sortOrder: query.sortOrder ?? 'ASC',
    } as any);

    // On recharge la session pour le nom de fichier (optionnel)
    const session = await this.sessionsService.findOne(sessionId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SIGIF POINTAGE';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Présences', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    // Colonnes per diem (sans image)
    sheet.columns = [
      { header: 'N°', key: 'n', width: 6 },
      { header: 'Nom & Prénom', key: 'fullName', width: 26 },
      { header: 'Fonction', key: 'function', width: 18 },
      { header: 'Organisation', key: 'organization', width: 18 },
      { header: 'CNI', key: 'cni', width: 18 },
      { header: 'Téléphone', key: 'phone', width: 16 },
      { header: 'Email', key: 'email', width: 24 },
      { header: 'Date session', key: 'sessionDate', width: 14 },
      { header: 'Heure pointage', key: 'time', width: 14 },
      { header: 'Signature', key: 'hasSignature', width: 12 },
      { header: 'Notes', key: 'notes', width: 20 },
    ];

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'left' };

    // Remplissage
    const items = result.items ?? [];
    items.forEach((a: any, idx: number) => {
      const p = a.participant ?? {};
      const dt = a.checkInTime ? new Date(a.checkInTime) : null;

      sheet.addRow({
        n: idx + 1,
        fullName: p.fullName ?? '',
        function: p.function ?? '',
        organization: p.organization ?? '',
        cni: p.cniNumber ?? '',
        phone: p.phone ?? '',
        email: p.email ?? '',
        sessionDate: session.sessionDate ?? '',
        time: dt ? dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
        hasSignature: a.hasSignature ? 'Oui' : 'Non',
        notes: a.notes ?? '',
      });
    });

    // Bordures légères
    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
        if (rowNumber === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      });
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  } */

  async exportSessionAttendancesXlsx(
    sessionId: string,
    query: {
      hasSignature?: boolean;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ): Promise<Buffer> {
    // On récupère les données déjà enrichies (event + session + items + stats)
    const data = await this.findBySession(sessionId, {
      page: 1,
      limit: 100000,
      hasSignature: query.hasSignature,
      sortBy: query.sortBy ?? 'checkInTime',
      sortOrder: query.sortOrder ?? 'ASC',
    });

    const eventTypeLabelFR = (t?: string) => {
      switch (t) {
        case 'workshop':
          return 'Atelier';
        case 'training':
          return 'Formation';
        case 'committee':
          return 'Comité';
        case 'seminar':
          return 'Séminaire';
        case 'meeting':
          return 'Réunion';
        case 'other':
          return 'Autre';
        default:
          return t ?? '—';
      }
    };

    const session = data.session; // contient label, date, location...
    const items = data.items ?? [];
    const stats = data.stats;

    // ✅ Si tu veux le titre event, on peut le récupérer via la première ligne items (si existant)
    // ou via EventsService si tu préfères (mais ici on garde simple et robuste)
    const eventTitle = items?.[0]?.event?.title ?? '—';
    const eventType = items?.[0]?.event?.eventType ?? '—';
    const eventStartDate = items?.[0]?.event?.startDate ?? null;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SIGIF POINTAGE';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Présences', {
      views: [{ state: 'frozen', ySplit: 7 }], // fige l'en-tête tableau
    });

    // =========================
    // Styles utilitaires
    // =========================
    const titleFont = { bold: true, size: 14 } as ExcelJS.Font;
    const labelFont = { bold: true } as ExcelJS.Font;
    const headerFont = { bold: true } as ExcelJS.Font;

    const borderThin: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    };

    // =========================
    // EN-TÊTE INSTITUTIONNEL
    // =========================
    // On utilise A1:K1 pour une belle largeur
    sheet.mergeCells('A1:K1');
    sheet.getCell('A1').value = 'FEUILLE DE PRÉSENCE — EXPORT EXCEL';
    sheet.getCell('A1').font = titleFont;
    sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 24;

    const fmtDateTime = (iso?: string | null) => {
      if (!iso) return '—';
      const d = new Date(iso);
      return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const fmtDate = (iso?: string | null) => {
      if (!iso) return '—';
      const d = new Date(iso);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const metaRows: Array<[string, string]> = [
      ['Événement', eventTitle],
      ['Type', eventTypeLabelFR(String(eventType))],
      ['Date événement', fmtDateTime(eventStartDate)],
      ['Session', session?.label ?? '—'],
      ['Date session', session?.sessionDate ? fmtDate(session.sessionDate) : '—'],
      ['Lieu', session?.location ?? '—'],
      ['Généré le', fmtDateTime(new Date().toISOString())],
    ];

    let r = 2;
    for (const [k, v] of metaRows) {
      sheet.getCell(`A${r}`).value = k;
      sheet.getCell(`A${r}`).font = labelFont;
      sheet.getCell(`A${r}`).alignment = { vertical: 'middle', horizontal: 'left' };

      sheet.mergeCells(`B${r}:K${r}`);
      sheet.getCell(`B${r}`).value = v;
      sheet.getCell(`B${r}`).alignment = { vertical: 'middle', horizontal: 'left' };

      r++;
    }

    // Stats (optionnel mais très utile)
    sheet.getCell(`A${r}`).value = 'Statistiques';
    sheet.getCell(`A${r}`).font = labelFont;
    sheet.mergeCells(`B${r}:K${r}`);
    sheet.getCell(`B${r}`).value = stats
      ? `Total: ${stats.total} | Avec signature: ${stats.withSignature} | Sans signature: ${stats.withoutSignature} | Taux: ${stats.signatureRate}%`
      : '—';
    r++;

    // Ligne vide
    r++;

    // =========================
    // TABLEAU PER DIEM
    // =========================
    const headerRowIndex = r;

    sheet.columns = [
      { header: 'N°', key: 'n', width: 6 },
      { header: 'Nom & Prénom', key: 'fullName', width: 26 },
      { header: 'Fonction', key: 'function', width: 18 },
      { header: 'Organisation', key: 'organization', width: 20 },
      { header: 'CNI', key: 'cni', width: 18 },
      { header: 'Téléphone', key: 'phone', width: 16 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Heure pointage', key: 'time', width: 14 },
      { header: 'Signature', key: 'hasSignature', width: 12 },
      { header: 'Mode', key: 'mode', width: 12 },
      { header: 'Notes', key: 'notes', width: 22 },
    ];

    // Écrire l'en-tête du tableau à la ligne r
    const headers = sheet.columns.map((c) => c.header as string);
    sheet.getRow(headerRowIndex).values = headers;
    sheet.getRow(headerRowIndex).font = headerFont;
    sheet.getRow(headerRowIndex).alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(headerRowIndex).height = 20;

    // Style header
    for (let c = 1; c <= sheet.columns.length; c++) {
      const cell = sheet.getRow(headerRowIndex).getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      cell.border = borderThin;
    }

    // Lignes
    let line = headerRowIndex + 1;
    items.forEach((a: any, idx: number) => {
      const p = a.participant ?? {};
      const t = a.checkInTime ? new Date(a.checkInTime) : null;

      const rowValues = {
        n: idx + 1,
        fullName: p.fullName ?? '',
        function: p.function ?? '',
        organization: p.organization ?? '',
        cni: p.cniNumber ?? '',
        phone: p.phone ?? '',
        email: p.email ?? '',
        time: t ? t.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
        hasSignature: a.hasSignature ? 'Oui' : 'Non',
        mode: a.checkInMode ?? '',
        notes: a.notes ?? '',
      };

      sheet.getRow(line).values = Object.values(rowValues);

      // Bordures + alignement
      sheet.getRow(line).eachCell((cell) => {
        cell.border = borderThin;
        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      });

      line++;
    });

    // Auto-fit léger (hauteur)
    for (let i = headerRowIndex + 1; i < line; i++) {
      sheet.getRow(i).height = 18;
    }

    // Buffer final
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
