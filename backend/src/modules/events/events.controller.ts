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
import { UpdateEventStatusDto } from './dto/update-event-status.dto';

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
    const event = await this.eventsService.create(createEventDto, user);

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
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: User,
  ) {
    const event = await this.eventsService.update(id, updateEventDto, user);

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
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    await this.eventsService.remove(id, user);

    return {
      success: true,
      message: 'Événement supprimé avec succès',
    };
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.eventsService.updateStatus(id, dto, user);
  }
}
