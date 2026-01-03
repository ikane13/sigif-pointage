import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventStatus } from '../../database/entities/event.entity';
import * as QRCode from 'qrcode';
import * as PDFDocument from 'pdfkit';
import { randomBytes } from 'crypto';
import { PassThrough } from 'stream';

@Injectable()
export class QrCodesService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  /**
   * Générer un token sécurisé pour le QR code
   */
  private generateToken(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Générer l'URL de pointage à partir du token
   */
  private getPointageUrl(token: string): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    return `${frontendUrl}/pointage?token=${token}`;
  }

  private assertEventNotLocked(event: Event) {
    if (event.status === EventStatus.COMPLETED || event.status === EventStatus.CANCELLED) {
      throw new BadRequestException("Action interdite : l'événement est terminé ou annulé");
    }
  }

  /**
   * Générer ou régénérer le QR code pour un événement
   */
  async generateQrCode(eventId: string): Promise<{
    token: string;
    generatedAt: Date;
    urls: {
      display: string;
      pointage: string;
      downloadPng: string;
      downloadPdf: string;
    };
  }> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }
    this.assertEventNotLocked(event);

    const token = this.generateToken();
    const generatedAt = new Date();

    event.qrToken = token;
    event.qrGeneratedAt = generatedAt;
    event.qrScanCount = 0;

    await this.eventRepository.save(event);

    console.log(`QR Code généré pour l'événement "${event.title}"`);

    const apiUrl = process.env.API_URL || 'http://localhost:3000/api';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

    return {
      token,
      generatedAt,
      urls: {
        display: `${frontendUrl}/qr/${token}`,
        pointage: this.getPointageUrl(token),
        downloadPng: `${apiUrl}/events/${eventId}/qr-code/download?format=png`,
        downloadPdf: `${apiUrl}/events/${eventId}/qr-code/download?format=pdf`,
      },
    };
  }

  /**
   * Obtenir les informations du QR code d'un événement
   */
  async getQrCodeInfo(eventId: string): Promise<{
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
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }
    this.assertEventNotLocked(event);

    if (!event.qrToken) {
      throw new NotFoundException('Aucun QR code généré pour cet événement');
    }

    const apiUrl = process.env.API_URL || 'http://localhost:3000/api';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

    return {
      token: event.qrToken,
      generatedAt: event.qrGeneratedAt,
      scanCount: event.qrScanCount || 0,
      urls: {
        display: `${frontendUrl}/qr/${event.qrToken}`,
        pointage: this.getPointageUrl(event.qrToken),
        downloadPng: `${apiUrl}/events/${eventId}/qr-code/download?format=png`,
        downloadPdf: `${apiUrl}/events/${eventId}/qr-code/download?format=pdf`,
      },
    };
  }

  /**
   * Valider un token et récupérer l'événement associé
   */
  async validateToken(token: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { qrToken: token },
    });

    if (!event) {
      throw new NotFoundException('QR code invalide ou expiré');
    }
    this.assertEventNotLocked(event);

    // Incrément atomique (pas de race condition)
    await this.eventRepository.increment({ id: event.id }, 'qrScanCount', 1);

    // Log avec count estimé (pas besoin de reload pour économiser une requête SQL)
    const estimatedCount = (event.qrScanCount || 0) + 1;
    console.log(`QR Code scanné pour "${event.title}" (scan ~${estimatedCount})`);

    return event;
  }

  /**
   * Générer l'image PNG du QR code
   */
  async generatePngBuffer(eventId: string): Promise<Buffer> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event || !event.qrToken) {
      throw new NotFoundException('QR code non généré pour cet événement');
    }
    this.assertEventNotLocked(event);

    const pointageUrl = this.getPointageUrl(event.qrToken);

    try {
      const qrCodeBuffer = await QRCode.toBuffer(pointageUrl, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 800,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      console.log(` QR Code PNG généré (${qrCodeBuffer.length} bytes)`);
      return qrCodeBuffer;
    } catch (error) {
      console.error('❌ Erreur génération PNG:', error);
      throw new InternalServerErrorException('Erreur lors de la génération du QR code');
    }
  }

  /**
   * Générer le PDF formaté du QR code
   *  Retourne un stream Node.js (pas un PDFDocument)
   */
  async generatePdfStream(eventId: string): Promise<NodeJS.ReadableStream> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event || !event.qrToken) {
      throw new NotFoundException('QR code non généré pour cet événement');
    }
    this.assertEventNotLocked(event);

    const pointageUrl = this.getPointageUrl(event.qrToken);

    try {
      //  Générer le QR code en Buffer (pas en DataURL)
      const qrCodeBuffer = await QRCode.toBuffer(pointageUrl, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 400,
        margin: 2,
      });

      //  Créer un stream intermédiaire
      const stream = new PassThrough();

      //  Créer le document PDF avec cast as any (compatibilité TypeScript)
      const doc = new (PDFDocument as any)({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      //  Pipe le PDF dans le stream
      doc.pipe(stream);

      // En-tête
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('RÉPUBLIQUE DU SÉNÉGAL', { align: 'center' })
        .fontSize(12)
        .font('Helvetica')
        .text('Un Peuple - Un But - Une Foi', { align: 'center' })
        .moveDown(0.5)
        .text('Ministère de la Fonction Publique', { align: 'center' })
        .text('Direction de la Transformation Digitale', { align: 'center' })
        .moveDown(2);

      // Ligne de séparation
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown(2);

      //  QR Code centré (utiliser le Buffer)
      const qrSize = 400;
      const pageWidth = 595.28; // A4 width in points
      const qrX = (pageWidth - qrSize) / 2;

      doc.image(qrCodeBuffer, qrX, doc.y, {
        width: qrSize,
        height: qrSize,
      });

      doc.moveDown(10);

      // Titre de l'événement
      doc.fontSize(18).font('Helvetica-Bold').text(event.title, { align: 'center' }).moveDown(1);

      // Ligne de séparation
      doc.moveTo(150, doc.y).lineTo(445, doc.y).stroke().moveDown(1);

      // Détails de l'événement
      doc
        .fontSize(12)
        .font('Helvetica')
        .text(
          `📅 Date : ${new Date(event.startDate).toLocaleString('fr-FR', {
            dateStyle: 'full',
            timeStyle: 'short',
          })}`,
          { align: 'center' },
        )
        .moveDown(0.5)
        .text(`📍 Lieu : ${event.location}`, { align: 'center' })
        .moveDown(2);

      // Instructions
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Instructions :', { align: 'left' })
        .font('Helvetica')
        .text("1. Ouvrez l'appareil photo de votre smartphone")
        .text('2. Pointez vers le QR code ci-dessus')
        .text('3. Cliquez sur le lien qui apparaît')
        .text('4. Remplissez le formulaire de pointage avec votre signature')
        .moveDown(2);

      // Pied de page
      doc
        .fontSize(9)
        .fillColor('#666666')
        .text('Pour toute question : support@sigif.gouv.sn', { align: 'center' });

      //  Finaliser le document
      doc.end();

      console.log(` QR Code PDF généré pour "${event.title}"`);

      //  Retourner le stream (pas le doc)
      return stream;
    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      throw new InternalServerErrorException('Erreur lors de la génération du PDF');
    }
  }
}
