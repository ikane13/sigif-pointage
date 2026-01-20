import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session, SessionStatus, EventStatus, Event } from '@/database/entities';
import * as QRCode from 'qrcode';
import * as PDFDocument from 'pdfkit';
import { randomBytes } from 'crypto';
import { PassThrough } from 'stream';

@Injectable()
export class QrCodesService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,

    // optionnel (utile si tu veux des requêtes direct Event), sinon tu peux enlever
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  private generateToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private getPointageUrl(token: string): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    // Le front utilisera validateToken(token) pour récupérer sessionId, puis post /attendances
    return `${frontendUrl}/pointage?token=${token}`;
  }

  private assertSessionNotLocked(session: Session) {
    // Event annulé => blocage total
    if (session.event?.status === EventStatus.CANCELLED) {
      throw new BadRequestException("Action interdite : l'événement est annulé");
    }

    // Session terminée/annulée => pas de génération/affichage QR
    if (session.status === SessionStatus.COMPLETED || session.status === SessionStatus.CANCELLED) {
      throw new BadRequestException('Action interdite : la session est terminée ou annulée');
    }
  }

  async generateQrCode(sessionId: string): Promise<{
    token: string;
    generatedAt: Date;
    urls: {
      display: string;
      pointage: string;
      downloadPng: string;
      downloadPdf: string;
    };
  }> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['event'],
    });

    if (!session) throw new NotFoundException('Session introuvable');

    this.assertSessionNotLocked(session);

    const token = this.generateToken();
    const generatedAt = new Date();

    session.qrToken = token;
    session.qrGeneratedAt = generatedAt;
    session.qrScanCount = 0;

    await this.sessionRepository.save(session);

    const apiUrl = process.env.API_URL || 'http://localhost:3000/api';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

    return {
      token,
      generatedAt,
      urls: {
        display: `${frontendUrl}/qr/${token}`,
        pointage: this.getPointageUrl(token),
        downloadPng: `${apiUrl}/sessions/${sessionId}/qr-code/download?format=png`,
        downloadPdf: `${apiUrl}/sessions/${sessionId}/qr-code/download?format=pdf`,
      },
    };
  }

  async getQrCodeInfo(sessionId: string): Promise<{
    token: string;
    generatedAt: Date;
    scanCount: number;
    urls: {
      display: string;
      pointage: string;
      downloadPng: string;
      downloadPdf: string;
    };
  }> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['event'],
    });

    if (!session) throw new NotFoundException('Session introuvable');
    this.assertSessionNotLocked(session);

    if (!session.qrToken) {
      throw new NotFoundException('Aucun QR code généré pour cette session');
    }

    const apiUrl = process.env.API_URL || 'http://localhost:3000/api';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

    return {
      token: session.qrToken,
      generatedAt: session.qrGeneratedAt,
      scanCount: session.qrScanCount || 0,
      urls: {
        display: `${frontendUrl}/qr/${session.qrToken}`,
        pointage: this.getPointageUrl(session.qrToken),
        downloadPng: `${apiUrl}/sessions/${sessionId}/qr-code/download?format=png`,
        downloadPdf: `${apiUrl}/sessions/${sessionId}/qr-code/download?format=pdf`,
      },
    };
  }

  /**
   * Validation publique: token -> session + event
   * Incrémente qrScanCount sur Session
   */
  async validateToken(token: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { qrToken: token },
      relations: ['event'],
    });

    if (!session) {
      throw new NotFoundException('QR code invalide ou expiré');
    }

    // Option: si event annulé, on bloque carrément
    if (session.event?.status === EventStatus.CANCELLED) {
      throw new BadRequestException("QR code invalide : l'événement est annulé");
    }

    await this.sessionRepository.increment({ id: session.id }, 'qrScanCount', 1);

    return session;
  }

  async generatePngBuffer(sessionId: string): Promise<Buffer> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['event'],
    });

    if (!session || !session.qrToken) {
      throw new NotFoundException('QR code non généré pour cette session');
    }
    this.assertSessionNotLocked(session);

    const pointageUrl = this.getPointageUrl(session.qrToken);

    try {
      return await QRCode.toBuffer(pointageUrl, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 800,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de la génération du QR code');
    }
  }

  async generatePdfStream(sessionId: string): Promise<NodeJS.ReadableStream> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['event'],
    });

    if (!session || !session.qrToken) {
      throw new NotFoundException('QR code non généré pour cette session');
    }
    this.assertSessionNotLocked(session);

    const pointageUrl = this.getPointageUrl(session.qrToken);

    try {
      const qrCodeBuffer = await QRCode.toBuffer(pointageUrl, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 400,
        margin: 2,
      });

      const stream = new PassThrough();
      const doc = new (PDFDocument as any)({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      doc.pipe(stream);

      // En-tête (tu remplacerais ensuite par ton template institutionnel final)
      doc.fontSize(18).font('Helvetica-Bold').text('QR Code de pointage', { align: 'center' });
      doc.moveDown(1);

      doc.fontSize(12).font('Helvetica-Bold').text(session.event.title, { align: 'center' });
      doc.fontSize(11).font('Helvetica').moveDown(0.5);

      const ymd = new Date(session.sessionDate).toISOString().slice(0, 10);
      const sessionName = session.title ? `${session.title} (${session.label})` : session.label;

      doc.text(`Session: ${sessionName}`, { align: 'center' });
      doc.text(`Date session: ${ymd}`, { align: 'center' });
      if (session.location || session.event.location) {
        doc.text(`Lieu: ${session.location ?? session.event.location}`, { align: 'center' });
      }

      doc.moveDown(1.5);

      const qrSize = 400;
      const pageWidth = 595.28;
      const qrX = (pageWidth - qrSize) / 2;

      doc.image(qrCodeBuffer, qrX, doc.y, { width: qrSize, height: qrSize });
      doc.moveDown(10);

      doc.fontSize(9).font('Helvetica').text(`Lien: ${pointageUrl}`, { align: 'center' });

      doc.end();
      return stream;
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de la génération du PDF');
    }
  }
}
