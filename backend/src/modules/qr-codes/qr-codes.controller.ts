import { Controller, Post, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { QrCodesService } from './qr-codes.service';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole, SessionStatus, EventStatus } from '@/database/entities';

@Controller()
export class QrCodesController {
  constructor(private readonly qrCodesService: QrCodesService) {}

  /**
   * POST /api/sessions/:id/qr-code
   */
  @Post('sessions/:id/qr-code')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  async generateQrCode(@Param('id') sessionId: string) {
    const result = await this.qrCodesService.generateQrCode(sessionId);

    return {
      success: true,
      message: 'QR code généré avec succès',
      data: result,
    };
  }

  /**
   * GET /api/sessions/:id/qr-code
   */
  @Get('sessions/:id/qr-code')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  async getQrCodeInfo(@Param('id') sessionId: string) {
    const result = await this.qrCodesService.getQrCodeInfo(sessionId);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /api/sessions/:id/qr-code/download?format=png|pdf
   */
  @Get('sessions/:id/qr-code/download')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  async downloadQrCode(
    @Param('id') sessionId: string,
    @Query('format') format: string,
    @Res() res: Response,
  ) {
    if (format === 'pdf') {
      const pdfStream = await this.qrCodesService.generatePdfStream(sessionId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="QR_Code_Session_${sessionId}.pdf"`,
      );

      pdfStream.pipe(res);
    } else {
      const pngBuffer = await this.qrCodesService.generatePngBuffer(sessionId);

      res.setHeader('Content-Type', 'image/png');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="QR_Code_Session_${sessionId}.png"`,
      );

      res.send(pngBuffer);
    }
  }

  /**
   * PUBLIC
   * GET /api/qr-codes/validate/:token
   */

  @Get('qr-codes/validate/:token')
  async validateToken(@Param('token') token: string) {
    const session = await this.qrCodesService.validateToken(token);

    const canCheckIn =
      session.event.status === EventStatus.ONGOING && session.status === SessionStatus.ONGOING;

    return {
      success: true,
      data: {
        event: {
          id: session.event.id,
          title: session.event.title,
          eventType: session.event.eventType,
          startDate: session.event.startDate,
          endDate: session.event.endDate,
          location: session.event.location,
          status: session.event.status,
          description: session.event.description,
        },
        session: {
          id: session.id,
          sessionNumber: session.sessionNumber,
          sessionDate: session.sessionDate,
          label: session.label,
          title: session.title ?? null,
          startTime: session.startTime,
          endTime: session.endTime,
          location: session.location,
          status: session.status,
        },
        canCheckIn,
      },
    };
  }
}
