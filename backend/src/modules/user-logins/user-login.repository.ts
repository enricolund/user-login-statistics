import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { UserLoginRepositoryInterface } from './repository.interface';
import { BrowserStats, DeviceStats, RegionStats, SessionStats, StatsMap } from '../stats/stats.interface';
import { UserLogin } from '../../generated/prisma';
import { UserLoginCreate } from './user-login.interface';

@Injectable()
export class UserLoginRepository implements UserLoginRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async createUserLogin(data: UserLoginCreate): Promise<UserLogin> {
    return this.prisma.userLogin.create({ data });
  }

  async createUserLogins(data: UserLoginCreate[]): Promise<{ count: number }> {
    return this.prisma.userLogin.createMany({ data });
  }

  // Overloads
  private async getStatsByField(field: 'region'): Promise<RegionStats[]>;
  private async getStatsByField(field: 'device_type'): Promise<DeviceStats[]>;
  private async getStatsByField(field: 'browser'): Promise<BrowserStats[]>;

  // Implementation compatible with overloads
  private async getStatsByField<T extends keyof StatsMap>(
    field: T
  ): Promise<StatsMap[T][]> {
    const result = await this.prisma.userLogin.groupBy({
      by: [field],
      _count: { [field]: true },
      orderBy: { _count: { [field]: 'desc' } },
    });

    if (!Array.isArray(result)) {
      throw new Error(typeof result === 'string' ? result : 'Unexpected groupBy result');
    }

    return result.map(item => ({
      [field]: item[field],
      count: item._count[field],
    })) as StatsMap[T][];
  }

  async getRegionStats(): Promise<RegionStats[]> {
    return this.getStatsByField('region');
  }

  async getDeviceTypeStats(): Promise<DeviceStats[]> {
    return this.getStatsByField('device_type');
  }

  async getBrowserStats(): Promise<BrowserStats[]> {
    return this.getStatsByField('browser');
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
