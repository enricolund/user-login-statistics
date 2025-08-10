import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { UserLoginRepositoryInterface } from './repository.interface';
import { SessionStats } from '../stats/stats.interface';
import { UserLogin } from '../../generated/prisma';
import { UserLoginCreate } from './user-login.interface';

@Injectable()
export class UserLoginRepository implements UserLoginRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async createUserLogin(data: UserLoginCreate): Promise<UserLogin> {
    return this.prisma.userLogin.create({
      data: data,
    });
  }

  async createUserLogins(data: UserLoginCreate[]): Promise<{ count: number }> {
    return this.prisma.userLogin.createMany({
      data: data
    });
  }

  async getRegionStats(): Promise<{ region: string; count: number }[]> {
    const result = await this.prisma.userLogin.groupBy({
      by: ['region'],
      _count: {
        region: true,
      },
      orderBy: {
        _count: {
          region: 'desc',
        },
      },
    });

    return result.map(item => ({
      region: item.region,
      count: item._count.region,
    }));
  }

  async getDeviceTypeStats(): Promise<{ device_type: string; count: number }[]> {
    const result = await this.prisma.userLogin.groupBy({
      by: ['device_type'],
      _count: {
        device_type: true,
      },
      orderBy: {
        _count: {
          device_type: 'desc',
        },
      },
    });

    return result.map(item => ({
      device_type: item.device_type,
      count: item._count.device_type,
    }));
  }

  async getBrowserStats(): Promise<{ browser: string; count: number }[]> {
    const result = await this.prisma.userLogin.groupBy({
      by: ['browser'],
      _count: {
        browser: true,
      },
      orderBy: {
        _count: {
          browser: 'desc',
        },
      },
    });

    return result.map(item => ({
      browser: item.browser,
      count: item._count.browser,
    }));
  }

  async getSessionStats(): Promise<SessionStats> {
    try {
      // Use raw SQL for better performance
      const result = await this.prisma.$queryRaw<Array<{
        total_sessions: bigint;
        avg_duration: number;
        min_duration: number;
        max_duration: number;
        median_duration: number;
      }>>`
        SELECT 
          COUNT(*) as total_sessions,
          COALESCE(AVG(session_duration_seconds), 0) as avg_duration,
          COALESCE(MIN(session_duration_seconds), 0) as min_duration,
          COALESCE(MAX(session_duration_seconds), 0) as max_duration,
          COALESCE(
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY session_duration_seconds), 
            0
          ) as median_duration
        FROM user_logins 
        WHERE session_duration_seconds IS NOT NULL
      `;

      if (result.length === 0) {
        return {
          totalSessions: 0,
          averageDuration: 0,
          minDuration: 0,
          maxDuration: 0,
          medianDuration: 0,
        };
      }

      const stats = result[0];
      return {
        totalSessions: Number(stats.total_sessions),
        averageDuration: Number(stats.avg_duration),
        minDuration: Number(stats.min_duration),
        maxDuration: Number(stats.max_duration),
        medianDuration: Number(stats.median_duration),
      };
    } catch (error) {
      console.error('Error executing raw SQL for session duration stats:', error);
      return {
        totalSessions: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        medianDuration: 0,
      };
    }
  }
}
