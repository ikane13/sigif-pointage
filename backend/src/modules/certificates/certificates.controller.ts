import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/database/entities/user.entity';
import { CertificatesService } from './certificates.service';
import {
  GenerateCertificatesDto,
  CreateCertificateDto,
  CertificateResponseDto,
} from './dto';

@Controller('certificates')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  /**
   * Générer des certificats en masse pour un événement
   * POST /certificates/events/:eventId/generate
   */
  @Post('events/:eventId/generate')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @HttpCode(HttpStatus.CREATED)
  async generateBulkCertificates(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() generateDto: GenerateCertificatesDto,
    @Request() req,
  ): Promise<CertificateResponseDto[]> {
    const userId = req.user.userId;
    return this.certificatesService.generateBulkCertificates(
      eventId,
      generateDto,
      userId,
    );
  }

  /**
   * Créer un certificat individuel
   * POST /certificates/events/:eventId
   */
  @Post('events/:eventId')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() createDto: CreateCertificateDto,
    @Request() req,
  ): Promise<CertificateResponseDto> {
    const userId = req.user.userId;
    return this.certificatesService.create(eventId, createDto, userId);
  }

  /**
   * Récupérer tous les certificats d'un événement
   * GET /certificates/events/:eventId
   */
  @Get('events/:eventId')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER, UserRole.VIEWER)
  async findByEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<CertificateResponseDto[]> {
    return this.certificatesService.findByEvent(eventId);
  }

  /**
   * Récupérer un certificat par son ID
   * GET /certificates/:id
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER, UserRole.VIEWER)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CertificateResponseDto> {
    return this.certificatesService.findOne(id);
  }

  /**
   * Récupérer les certificats d'un participant
   * GET /certificates/participants/:participantId
   */
  @Get('participants/:participantId')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER, UserRole.VIEWER)
  async findByParticipant(
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ): Promise<CertificateResponseDto[]> {
    return this.certificatesService.findByParticipant(participantId);
  }

  /**
   * Vérifier si un participant a un certificat pour un événement
   * GET /certificates/events/:eventId/participants/:participantId/exists
   */
  @Get('events/:eventId/participants/:participantId/exists')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER, UserRole.VIEWER)
  async hasCertificate(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ): Promise<{ exists: boolean }> {
    const exists = await this.certificatesService.hasCertificate(
      eventId,
      participantId,
    );
    return { exists };
  }

  /**
   * Récupérer le certificat d'un participant pour un événement
   * GET /certificates/events/:eventId/participants/:participantId
   */
  @Get('events/:eventId/participants/:participantId')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER, UserRole.VIEWER)
  async findByEventAndParticipant(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ): Promise<CertificateResponseDto | null> {
    return this.certificatesService.findByEventAndParticipant(
      eventId,
      participantId,
    );
  }

  /**
   * Supprimer un certificat
   * DELETE /certificates/:id
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.certificatesService.remove(id);
  }
}
