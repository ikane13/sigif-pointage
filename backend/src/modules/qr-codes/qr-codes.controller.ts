import { Controller, Post, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { QrCodesService } from './qr-codes.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';

@Controller()
export class QrCodesController {
  constructor(private readonly qrCodesService: QrCodesService) {}

  /**
   * Générer ou régénérer le QR code d'un événement
   * POST /api/events/:id/qr-code
   */
  @Post('events/:id/qr-code')
  @UseGuards(AuthGuard('jwt'), RolesGuard) // ✅ Passport JWT + RolesGuard
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  async generateQrCode(@Param('id') eventId: string) {
    const result = await this.qrCodesService.generateQrCode(eventId);

    return {
      success: true,
      message: 'QR code généré avec succès',
      data: result,
    };
  }

  /**
   * Obtenir les informations du QR code d'un événement
   * GET /api/events/:id/qr-code
   */
  @Get('events/:id/qr-code')
  @UseGuards(AuthGuard('jwt'), RolesGuard) // ✅ Passport JWT + RolesGuard
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  async getQrCodeInfo(@Param('id') eventId: string) {
    const result = await this.qrCodesService.getQrCodeInfo(eventId);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Télécharger le QR code (PNG ou PDF)
   * GET /api/events/:id/qr-code/download?format=png|pdf
   */
  @Get('events/:id/qr-code/download')
  @UseGuards(AuthGuard('jwt'), RolesGuard) // ✅ Passport JWT + RolesGuard
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  async downloadQrCode(
    @Param('id') eventId: string,
    @Query('format') format: string,
    @Res() res: Response,
  ) {
    if (format === 'pdf') {
      const pdfStream = await this.qrCodesService.generatePdfStream(eventId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="QR_Code_Event_${eventId}.pdf"`);

      pdfStream.pipe(res);
    } else {
      const pngBuffer = await this.qrCodesService.generatePngBuffer(eventId);

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="QR_Code_Event_${eventId}.png"`);

      res.send(pngBuffer);
    }
  }

  /**
   * Valider un token QR code et récupérer l'événement
   * GET /api/qr-codes/validate/:token
   * PUBLIC - Pas d'authentification requise
   */
  @Get('qr-codes/validate/:token')
  async validateToken(@Param('token') token: string) {
    const event = await this.qrCodesService.validateToken(token);

    return {
      success: true,
      data: {
        event: {
          id: event.id,
          title: event.title,
          eventType: event.eventType,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          status: event.status,
          description: event.description,
        },
        canCheckIn: event.status === 'scheduled' || event.status === 'ongoing',
      },
    };
  }
}
