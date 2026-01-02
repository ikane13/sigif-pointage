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
  ForbiddenException,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { User, UserRole } from '@/database/entities';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /api/users
   * Créer un utilisateur (admin uniquement)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);

    return {
      success: true,
      data: user,
      message: 'Utilisateur créé avec succès',
    };
  }

  /**
   * GET /api/users
   * Liste des utilisateurs (admin uniquement)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const result = await this.usersService.findAll({
      page,
      limit,
      role,
      search,
      isActive,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /api/users/:id
   * Détails d'un utilisateur
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findOne(id);

    return {
      success: true,
      data: user,
    };
  }

  /**
   * PATCH /api/users/:id
   * Modifier un utilisateur
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);

    return {
      success: true,
      data: user,
      message: 'Utilisateur modifié avec succès',
    };
  }

  /**
   * DELETE /api/users/:id
   * Supprimer un utilisateur (admin uniquement)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.remove(id);

    return {
      success: true,
      message: 'Utilisateur supprimé avec succès',
    };
  }

  /**
   * PATCH /api/users/:id/password
   * Changer le mot de passe
   */
  @Patch(':id/password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() currentUser: User,
  ) {
    // ✅ Vérifier que l'utilisateur change son propre mot de passe OU qu'il est admin
    if (currentUser.id !== id && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à modifier le mot de passe de cet utilisateur",
      );
    }

    await this.usersService.changePassword(id, changePasswordDto);

    return {
      success: true,
      message: 'Mot de passe modifié avec succès',
    };
  }
}
