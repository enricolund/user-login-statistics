import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export interface IHealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  database: boolean;
  uptime: number;
}

@Injectable()
export class HealthCheckService {
  constructor(private readonly prisma: PrismaService) {}

  async checkHealth(): Promise<IHealthStatus> {
    const timestamp = new Date().toISOString();
    let databaseHealthy = false;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseHealthy = true;
    } catch (error) {
      // Database is unhealthy
    }

    return {
      status: databaseHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      database: databaseHealthy,
      uptime: process.uptime(),
    };
  }
}
