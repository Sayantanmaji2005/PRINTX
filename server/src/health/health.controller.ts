import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  async checkHealth() {
    let dbStatus = 'disconnected';
    try {
      await this.prisma.$runCommandRaw({ ping: 1 });
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    return {
      message: 'PrintX API is healthy',
      data: {
        status: 'UP',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        mode: process.env.APP_MODE || 'development',
        services: {
          database: dbStatus,
        },
      },
    };
  }
}
