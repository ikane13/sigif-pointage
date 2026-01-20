import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { SessionsService } from './sessions.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User, UserRole } from '@/database/entities';
import { CreateSessionDto, UpdateSessionDto, UpdateSessionStatusDto } from './dto';

@Controller()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  /**
   * POST /api/events/:eventId/sessions
   * Créer une session (admin ou organizer)
   */
  @Post('events/:eventId/sessions')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: CreateSessionDto,
    @CurrentUser() user: User,
  ) {
    const session = await this.sessionsService.create(eventId, dto, user);

    return {
      success: true,
      data: session,
      message: 'Session créée avec succès',
    };
  }

  /**
   * GET /api/events/:eventId/sessions
   * Liste des sessions d’un événement (authentifié)
   */
  @Get('events/:eventId/sessions')
  @UseGuards(AuthGuard('jwt'))
  async findAllByEvent(@Param('eventId', ParseUUIDPipe) eventId: string) {
    const sessions = await this.sessionsService.findAllByEvent(eventId);

    return {
      success: true,
      data: sessions,
    };
  }

  /**
   * GET /api/sessions/:id
   * Détails d’une session (authentifié)
   */
  @Get('sessions/:id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const session = await this.sessionsService.findOne(id);

    return {
      success: true,
      data: session,
    };
  }

  /**
   * PATCH /api/sessions/:id
   * Modifier une session (admin ou organizer)
   */
  @Patch('sessions/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionDto,
    @CurrentUser() user: User,
  ) {
    const session = await this.sessionsService.update(id, dto, user);

    return {
      success: true,
      data: session,
      message: 'Session modifiée avec succès',
    };
  }

  /**
   * DELETE /api/sessions/:id
   * Supprimer une session (admin uniquement)
   */
  @Delete('sessions/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.sessionsService.remove(id);

    return {
      success: true,
      message: 'Session supprimée avec succès',
    };
  }

  /**
   * PATCH /api/sessions/:id/status
   * Mettre à jour le statut d’une session (admin ou organizer)
   */
  @Patch('sessions/:id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionStatusDto,
    @CurrentUser() user: User,
  ) {
    const session = await this.sessionsService.updateStatus(id, dto, user);

    return {
      success: true,
      data: session,
      message: 'Statut de la session mis à jour avec succès',
    };
  }

  @Post('events/:eventId/sessions/generate')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @HttpCode(HttpStatus.CREATED)
  async generateDaily(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.sessionsService.generateDailySessions(eventId, user);

    return {
      success: true,
      data: result,
      message: 'Sessions générées avec succès',
    };
  }
  /**
   * GET /api/sessions/:sessionId/attendances
   * Liste des présences pour une session (authentifié)
   */
  /*   @Get('sessions/:sessionId/attendances')
  @UseGuards(AuthGuard('jwt'))
  async attendancesBySession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('hasSignature', new ParseBoolPipe({ optional: true })) hasSignature?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const result = await this.attendancesService.findBySession(sessionId, {
      page,
      limit,
      hasSignature,
      sortBy,
      sortOrder,
    });

    return { success: true, data: result };
  } */
}
