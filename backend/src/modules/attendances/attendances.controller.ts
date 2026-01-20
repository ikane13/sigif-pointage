import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole, CheckInMode, User } from '@/database/entities';

@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  /**
   * POST /api/attendances
   * Créer une présence (pointage avec signature) - PUBLIC
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAttendanceDto: CreateAttendanceDto, @Req() request: Request) {
    // Récupérer l'IP et le User-Agent
    const ipAddress = (request.headers['x-forwarded-for'] as string) || request.ip;
    const userAgent = request.headers['user-agent'];

    const attendance = await this.attendancesService.create(
      createAttendanceDto,
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      data: {
        id: attendance.id,
        eventId: attendance.eventId,
        participantId: attendance.participantId,
        checkInTime: attendance.checkInTime,
        checkInMode: attendance.checkInMode,
        hasSignature: !!attendance.signatureData,
      },
      message: 'Présence enregistrée avec succès',
    };
  }

  /**
   * GET /api/attendances
   * Liste des présences (authentifié)
   */
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('eventId') eventId?: string,
    @Query('participantId') participantId?: string,
    @Query('checkInFrom') checkInFrom?: string,
    @Query('checkInTo') checkInTo?: string,
    @Query('hasSignature', new ParseBoolPipe({ optional: true })) hasSignature?: boolean,
    @Query('checkInMode') checkInMode?: CheckInMode,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('sessionId') sessionId?: string,
  ) {
    const result = await this.attendancesService.findAll({
      page,
      limit,
      eventId,
      sessionId,
      participantId,
      checkInFrom,
      checkInTo,
      hasSignature,
      checkInMode,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /api/attendances/:id
   * Détails d'une présence avec signature
   */
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const attendance = await this.attendancesService.findOne(id);

    return {
      success: true,
      data: attendance,
    };
  }

  /**
   * GET /api/attendances/:id/signature
   * Récupérer uniquement la signature
   */
  @Get(':id/signature')
  @UseGuards(AuthGuard('jwt'))
  async getSignature(@Param('id', ParseUUIDPipe) id: string) {
    const signature = await this.attendancesService.getSignature(id);

    return {
      success: true,
      data: signature,
    };
  }

  /**
   * DELETE /api/attendances/:id
   * Supprimer une présence (admin uniquement)
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    await this.attendancesService.remove(id, user);

    return {
      success: true,
      message: 'Présence supprimée avec succès',
    };
  }

  /**
   * GET /api/events/:eventId/attendances
   * Liste des présences pour un événement
   */
  @Get('event/:eventId')
  @UseGuards(AuthGuard('jwt'))
  async findByEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('hasSignature', new ParseBoolPipe({ optional: true })) hasSignature?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const result = await this.attendancesService.findByEvent(eventId, {
      page,
      limit,
      hasSignature,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      data: result,
    };
  }
}
