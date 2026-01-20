import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AttendancesService } from './attendances.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@/database/entities';
import { Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller('sessions')
export class SessionsAttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  /**
   * GET /api/sessions/:id/attendances
   * Liste des présences d'une session (admin/organizer)
   */
  @Get(':id/attendances')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  async findBySession(
    @Param('id', ParseUUIDPipe) sessionId: string,
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

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /api/sessions/:id/attendances/export?format=xlsx
   * Export Excel des présences d'une session
   */
  @Get(':id/attendances/export')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  async exportBySession(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Res() res: Response, //  placé AVANT les paramètres optionnels
    @Query('hasSignature', new ParseBoolPipe({ optional: true })) hasSignature?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const buffer = await this.attendancesService.exportSessionAttendancesXlsx(sessionId, {
      hasSignature,
      sortBy,
      sortOrder,
    });

    const fileName = `Presences_Session_${sessionId}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    return res.send(buffer);
  }
}
