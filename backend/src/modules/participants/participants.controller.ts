// participants.controller.ts
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
import { ParticipantsService } from './participants.service';
import { CreateParticipantDto, UpdateParticipantDto } from './dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@/database/entities';

@Controller('participants')
@UseGuards(AuthGuard('jwt'))
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  /**
   * POST /api/participants
   * Créer un participant manuellement (admin/organizer)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createParticipantDto: CreateParticipantDto) {
    const participant = await this.participantsService.create(createParticipantDto);

    return {
      success: true,
      data: participant,
      message: 'Participant créé avec succès',
    };
  }

  /**
   * GET /api/participants
   * Liste des participants
   */
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('organization') organization?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const result = await this.participantsService.findAll({
      page,
      limit,
      search,
      organization,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /api/participants/:id
   * Détails d'un participant
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const participant = await this.participantsService.findOne(id);

    return {
      success: true,
      data: participant,
    };
  }

  /**
   * PATCH /api/participants/:id
   * Modifier un participant
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateParticipantDto: UpdateParticipantDto,
  ) {
    const participant = await this.participantsService.update(id, updateParticipantDto);

    return {
      success: true,
      data: participant,
      message: 'Participant modifié avec succès',
    };
  }

  /**
   * DELETE /api/participants/:id
   * Supprimer un participant (admin uniquement)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.participantsService.remove(id);

    return {
      success: true,
      message: 'Participant supprimé avec succès',
    };
  }
}
