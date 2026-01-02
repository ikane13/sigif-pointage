import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import * as path from 'path';
import { DatabaseConfigService } from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// Modules métier
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EventsModule } from './modules/events/events.module';
import { ParticipantsModule } from './modules/participants/participants.module';
import { AttendancesModule } from './modules/attendances/attendances.module';
import { QrCodesModule } from './modules/qr-codes/qr-codes.module';

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      envFilePath: path.resolve(__dirname, '../../.env'),
      isGlobal: true,
      cache: true,
    }),

    // Configuration TypeORM
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfigService,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Modules métier
    AuthModule,
    UsersModule,
    EventsModule,
    ParticipantsModule,
    AttendancesModule,
    QrCodesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
