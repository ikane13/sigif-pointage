import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement
config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5442), // ✅ CORRIGÉ : 5442 au lieu de 5432
  username: configService.get<string>('DB_USERNAME', 'sigif_user'),
  password: configService.get<string>('DB_PASSWORD', 'Inconnue13!'),
  database: configService.get<string>('DB_NAME', 'sigif_pointage'),

  // Chemins pour les entités et migrations
  entities: [path.join(__dirname, '**', '*.entity.{ts,js}')],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],

  // Configuration
  synchronize: false,
  logging: configService.get<string>('NODE_ENV') === 'development',
  migrationsRun: true,
  ssl: false,
});
