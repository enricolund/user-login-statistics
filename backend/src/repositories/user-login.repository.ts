import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { IUserLogin } from '../dto/user-login.dto';
import { IStatsRepository } from '../interfaces/repository.interface';
import { SessionDurationStats } from '../interfaces/stats.interface';

@Injectable()
export class UserLoginRepository implements IStatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Helper to convert Prisma result to DTO format
  private toDTOFormat(prismaResult: any): IUserLogin {
    return {
      ...prismaResult,
      login_time: prismaResult.login_time.toISOString(),
      logout_time: prismaResult.logout_time ? prismaResult.logout_time.toISOString() : null,
      created_at: prismaResult.created_at.toISOString(),
      updated_at: prismaResult.updated_at.toISOString(),
    };
  }

  async findAll(): Promise<IUserLogin[]> {
    const results = await this.prisma.userLogin.findMany();
    return results.map(result => this.toDTOFormat(result));
  }

  async create(userData: IUserLogin.ICreate): Promise<IUserLogin> {
    // Convert date strings to Date objects for Prisma
    const prismaData = {
      ...userData,
      login_time: new Date(userData.login_time),
      logout_time: userData.logout_time ? new Date(userData.logout_time) : null,
    };
    
    const result = await this.prisma.userLogin.create({ data: prismaData });
    return this.toDTOFormat(result);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<IUserLogin[]> {
    const results = await this.prisma.userLogin.findMany({
      where: {
        login_time: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    return results.map(result => this.toDTOFormat(result));
  }

  async findByUserId(userId: number): Promise<IUserLogin[]> {
    const results = await this.prisma.userLogin.findMany({
      where: {
        user_id: userId,
      },
    });
    return results.map(result => this.toDTOFormat(result));
  }

  async findByRegion(region: string): Promise<IUserLogin[]> {
    const results = await this.prisma.userLogin.findMany({
      where: {
        region,
      },
    });
    return results.map(result => this.toDTOFormat(result));
  }

  async getRegionCounts(): Promise<{ region: string; count: number }[]> {
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

  async getDeviceTypeCounts(): Promise<{ device_type: string; count: number }[]> {
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

  async getBrowserCounts(): Promise<{ browser: string; count: number }[]> {
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

  async getSessionDurationStatsOptimized(): Promise<SessionDurationStats> {
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
      // Fallback to Prisma query if raw SQL fails
      const logins = await this.prisma.userLogin.findMany({
        where: {
          session_duration_seconds: {
            not: null,
          },
        },
        select: {
          session_duration_seconds: true,
        },
      });

      if (logins.length === 0) {
        return {
          totalSessions: 0,
          averageDuration: 0,
          minDuration: 0,
          maxDuration: 0,
          medianDuration: 0,
        };
      }

      const durations = logins
        .map(login => login.session_duration_seconds!)
        .sort((a, b) => a - b);

      return {
        totalSessions: durations.length,
        averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minDuration: durations[0],
        maxDuration: durations[durations.length - 1],
        medianDuration: durations[Math.floor(durations.length / 2)],
      };
    }
  }
}
