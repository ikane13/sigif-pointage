import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHello(): object {
    return {
      success: true,
      message: 'Bienvenue sur API SIGIF Pointage',
      version: '1.0.0',
      environment: this.configService.get<string>('NODE_ENV'),
      endpoints: {
        health: '/api/health',
        docs: '/api/docs (à venir)',
      },
    };
  }

  healthCheck(): object {
    return {
      success: true,
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get<string>('NODE_ENV'),
      database: 'Connected (PostgreSQL)',
    };
  }
}
