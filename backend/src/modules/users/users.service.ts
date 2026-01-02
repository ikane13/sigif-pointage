import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '@/database/entities';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Créer un nouvel utilisateur
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, firstName, lastName, role } = createUserDto;

    // Vérifier si l'email existe déjà
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur
    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      isActive: true,
    });

    await this.userRepository.save(user);

    // Retourner sans le hash du mot de passe
    delete user.passwordHash;
    return user;
  }

  /**
   * Récupérer tous les utilisateurs (avec pagination et filtres)
   */
  async findAll(query: {
    page?: number;
    limit?: number;
    role?: UserRole;
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ items: User[]; meta: any }> {
    const {
      page = 1,
      limit = 20,
      role,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const skip = (page - 1) * limit;

    // ✅ PROTECTION contre l'injection SQL
    const allowedSortFields = [
      'createdAt',
      'email',
      'firstName',
      'lastName',
      'role',
      'isActive',
      'lastLoginAt',
    ];

    if (!allowedSortFields.includes(sortBy)) {
      throw new BadRequestException(
        `Champ de tri invalide. Valeurs acceptées: ${allowedSortFields.join(', ')}`,
      );
    }

    // Validation de sortOrder
    if (!['ASC', 'DESC'].includes(sortOrder)) {
      throw new BadRequestException('Ordre de tri invalide. Valeurs acceptées: ASC, DESC');
    }

    // Construction de la requête
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Filtres
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Tri ✅ Sécurisé maintenant
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    // Pagination
    queryBuilder.skip(skip).take(limit);

    // Exclure le passwordHash
    queryBuilder.select([
      'user.id',
      'user.email',
      'user.firstName',
      'user.lastName',
      'user.role',
      'user.isActive',
      'user.lastLoginAt',
      'user.createdAt',
      'user.updatedAt',
    ]);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }
  /**
   * Récupérer un utilisateur par ID
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'lastLoginAt',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Charger les statistiques
    const stats = await this.getUserStats(id);
    (user as any).stats = stats;

    return user;
  }

  /**
   * Mettre à jour un utilisateur
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Vérifier si l'email est déjà utilisé
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    // Mettre à jour
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    // Retourner sans le hash
    delete user.passwordHash;
    return user;
  }

  /**
   * Supprimer un utilisateur (soft delete - désactivation)
   */
  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Soft delete : désactiver au lieu de supprimer
    user.isActive = false;
    await this.userRepository.save(user);
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Le mot de passe actuel est incorrect');
    }

    // Vérifier que le nouveau mot de passe est différent
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);

    if (isSamePassword) {
      throw new BadRequestException("Le nouveau mot de passe doit être différent de l'ancien");
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour
    user.passwordHash = passwordHash;
    await this.userRepository.save(user);
  }

  /**
   * Récupérer les statistiques d'un utilisateur
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async getUserStats(userId: string): Promise<any> {
    // TODO: Quand les modules Events seront créés, compléter avec:
    // - Nombre d'événements créés
    // - Date du dernier événement créé
    return {
      eventsCreated: 0,
      lastEventCreated: null,
    };
  }
}
