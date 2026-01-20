import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/database/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync } from 'fs';

// Configuration du stockage
const uploadPath = join(process.cwd(), 'uploads', 'signatures');

// Créer le dossier s'il n'existe pas
if (!existsSync(uploadPath)) {
  mkdirSync(uploadPath, { recursive: true });
}

const storage = diskStorage({
  destination: uploadPath,
  filename: (req, file, callback) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

@Controller('uploads/signatures')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UploadController {
  /**
   * Upload une image de signature
   * POST /uploads/signatures
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|svg\+xml)$/)) {
          return callback(
            new BadRequestException(
              'Seuls les formats JPG, PNG, GIF et SVG sont acceptés',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadSignature(
    @UploadedFile()
    file: Express.Multer.File,
  ): Promise<{ url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('Aucun fichier uploadé');
    }

    // Validation manuelle de la taille
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Le fichier est trop volumineux (max 5MB)');
    }

    // Retourner l'URL relative du fichier
    const url = `/uploads/signatures/${file.filename}`;

    return {
      url,
      filename: file.filename,
    };
  }
}
