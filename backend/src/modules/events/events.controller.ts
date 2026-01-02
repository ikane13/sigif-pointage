import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { User, UserRole, EventStatus, EventType } from '@/database/entities';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * POST /api/events
   * Créer un événement (admin ou organizer)
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createEventDto: CreateEventDto, @CurrentUser() user: User) {
    const event = await this.eventsService.create(createEventDto, user.id);

    return {
      success: true,
      data: event,
      message: 'Événement créé avec succès',
    };
  }

  /**
   * GET /api/events
   * Liste des événements (authentifié)
   */
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: EventStatus | EventStatus[],
    @Query('eventType') eventType?: EventType | EventType[],
    @Query('startDateFrom') startDateFrom?: string,
    @Query('startDateTo') startDateTo?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const result = await this.eventsService.findAll({
      page,
      limit,
      status,
      eventType,
      startDateFrom,
      startDateTo,
      search,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * ⚠️ IMPORTANT : Cette route DOIT être AVANT /api/events/:id
   * GET /api/events/by-code/:shortCode
   * Récupérer un événement par code QR (public)
   */
  /* @Get('by-code/:shortCode')
  async findByShortCode(
    @Param('shortCode') shortCode: string,
    @Query('t') timestamp: string,
    @Query('s') signature: string,
  ) {
    const event = await this.eventsService.findByShortCode(
      shortCode,
      parseInt(timestamp),
      signature,
    );

    return {
      success: true,
      data: {
        id: event.id,
        title: event.title,
        eventType: event.eventType,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        organizer: event.organizer,
        status: event.status,
      },
    };
  } */

  /**
   * GET /api/events/:id
   * Détails d'un événement (optionnel auth pour participants)
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const event = await this.eventsService.findOne(id);

    return {
      success: true,
      data: event,
    };
  }

  /**
   * PATCH /api/events/:id
   * Modifier un événement (admin ou créateur)
   */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateEventDto: UpdateEventDto) {
    const event = await this.eventsService.update(id, updateEventDto);

    return {
      success: true,
      data: event,
      message: 'Événement modifié avec succès',
    };
  }

  /**
   * DELETE /api/events/:id
   * Supprimer un événement (admin uniquement)
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.eventsService.remove(id);

    return {
      success: true,
      message: 'Événement supprimé avec succès',
    };
  }

  /**
   * POST /api/events/:id/regenerate-qr
   * Régénérer le QR code
   */
  /*   @Post(':id/regenerate-qr')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @HttpCode(HttpStatus.OK)
  async regenerateQRCode(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.eventsService.regenerateQRCode(id);

    return {
      success: true,
      data: result,
      message: 'QR code régénéré avec succès',
    };
  } */
}
