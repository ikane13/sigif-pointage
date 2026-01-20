import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, AuthResponseDto, UpdateProfileDto } from './dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/database/entities';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/login
   * Connexion d'un utilisateur
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<{ success: boolean; data: AuthResponseDto }> {
    const authResponse = await this.authService.login(loginDto);

    return {
      success: true,
      data: authResponse,
    };
  }

  /**
   * GET /api/auth/me
   * Profil de l'utilisateur connecté
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@CurrentUser() user: User): Promise<{ success: boolean; data: User }> {
    const profile = await this.authService.getProfile(user.id);

    return {
      success: true,
      data: profile,
    };
  }

  /**
   * PATCH /api/auth/me
   * Mettre à jour le profil de l'utilisateur connecté
   */
  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<{ success: boolean; data: User; message: string }> {
    const profile = await this.authService.updateProfile(user.id, updateProfileDto);

    return {
      success: true,
      data: profile,
      message: 'Profil mis à jour avec succès',
    };
  }

  /**
   * POST /api/auth/logout
   * Déconnexion (pour l'instant juste un endpoint vide)
   */
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<{ success: boolean; message: string }> {
    // Dans une vraie application, on pourrait :
    // - Invalider le token (blacklist)
    // - Supprimer les refresh tokens
    // Pour l'instant, c'est géré côté client

    return {
      success: true,
      message: 'Déconnexion réussie',
    };
  }

  /**
   * POST /api/auth/refresh
   * Rafraîchir le token (à implémenter plus tard avec refresh tokens)
   */
  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async refresh(@CurrentUser() user: User): Promise<{ success: boolean; data: any }> {
    // Pour l'instant, on renvoie juste un nouveau token
    const loginResult = await this.authService.login({
      email: user.email,
      password: '', // On n'a pas le mot de passe ici
    });

    // Note: Cette implémentation est simplifiée
    // Une vraie implémentation utiliserait des refresh tokens

    return {
      success: true,
      data: {
        accessToken: loginResult.accessToken,
        expiresIn: loginResult.expiresIn,
      },
    };
  }
}
