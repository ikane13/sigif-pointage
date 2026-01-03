import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import * as path from 'path';

@Injectable()
export class DatabaseConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbSsl = this.configService.get<string>('DB_SSL', 'false');

    return {
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USERNAME', 'sigif_user'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME', 'sigif_pointage'),

      // Charger toutes les entités du dossier database/entities
      entities: [path.join(__dirname, '..', 'database', 'entities', '*.entity.{ts,js}')],

      // NE PAS utiliser synchronize en production !
      synchronize: this.configService.get<boolean>('DB_SYNCHRONIZE', false),

      // Logging des requêtes SQL en développement
      logging: this.configService.get<boolean>('DB_LOGGING', false),

      // SSL - CORRECTION ICI
      ssl: dbSsl === 'true' ? { rejectUnauthorized: false } : false,

      // Options de performance
      extra: {
        max: 20, // Pool de connexions max
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
    };
  }
}
