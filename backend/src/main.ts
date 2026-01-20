import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import { AppModule } from './app.module';
import * as compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  // Créer l'application NestJS
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Augmenter la limite pour les signatures base64 (jusqu'à 500KB)
  app.use(express.json({ limit: '500kb' }));
  app.use(express.urlencoded({ limit: '500kb', extended: true }));

  // Servir les fichiers statiques (uploads)
  app.use('/uploads', express.static('uploads'));

  // Récupérer le service de configuration
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Configuration CORS
  app.enableCors({
    origin: ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Préfixe global pour toutes les routes
  app.setGlobalPrefix('api');

  // Validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les propriétés non définies dans le DTO
      forbidNonWhitelisted: true, // Renvoie une erreur si propriétés inconnues
      transform: true, // Transforme automatiquement les types
      transformOptions: {
        enableImplicitConversion: true, // Conversion automatique des types primitifs
      },
    }),
  );

  // Sécurité : Headers HTTP
  app.use(helmet());

  // Compression des réponses
  app.use(compression());

  // Démarrage du serveur
  await app.listen(port);

  console.log('');
  console.log('====================================');
  console.log('🚀 SIGIF Pointage API démarrée !');
  console.log('====================================');
  console.log(`📡 URL: http://localhost:${port}/api`);
  console.log(`🌍 Environnement: ${nodeEnv}`);
  console.log(`⏰ Démarré à: ${new Date().toLocaleString('fr-FR')}`);
  console.log('====================================');
  console.log('');
}

bootstrap();
