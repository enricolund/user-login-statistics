import { Injectable } from '@nestjs/common';
import { UserLoginRepository } from '../repositories/user-login.repository';
import { IUserLogin } from '../dto/user-login.dto';
import { GenerateUserLoginData } from '../generators/generate-user-login-data';
import { StatsCacheService } from './stats-cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { STATS_EVENTS } from '../events/stats-events';
import { MyConfiguration } from '../MyConfiguration';
import { IUserLoginService } from '../interfaces/user-login.interface';
import { SessionDurationStats, LoginTrend, PeakHourAnalysis } from '../interfaces/stats.interface';

@Injectable()
export class UserLoginService implements IUserLoginService {
  constructor(
    private readonly repo: UserLoginRepository,
    private readonly statsCache: StatsCacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  findAll(): Promise<IUserLogin[]> {
    return this.repo.findAll();
  }
  
  async create(dto: IUserLogin.ICreate): Promise<IUserLogin> {
    const result = await this.repo.create(dto);
    this.eventEmitter.emit(STATS_EVENTS.CACHE_INVALIDATED);
    return result;
  }

  async generateUserLoginData(): Promise<IUserLogin[]> {
    const fakeData = GenerateUserLoginData.generateMany(MyConfiguration.DEFAULT_FAKE_DATA_COUNT());

    const createdRecords = await Promise.all(
      fakeData.map(data => this.repo.create(data))
    );

    this.eventEmitter.emit(STATS_EVENTS.CACHE_INVALIDATED);

    return createdRecords;
  }

  async getLoginStatsByDateRange(startDate: Date, endDate: Date) {
    const logins = await this.repo.findByDateRange(startDate, endDate);
    
    return {
      totalLogins: logins.length,
      uniqueUsers: new Set(logins.map((login: IUserLogin) => login.user_id)).size,
      averageSessionDuration: this.calculateAverageSessionDuration(logins),
      loginsPerDay: this.groupLoginsByDate(logins),
      deviceTypeDistribution: this.groupByField(logins, 'device_type'),
      browserDistribution: this.groupByField(logins, 'browser'),
      regionDistribution: this.groupByField(logins, 'region'),
    };
  }

  async getTopActiveUsers(limit: number = MyConfiguration.DEFAULT_TOP_USERS_LIMIT()) {
    const logins = await this.repo.findAll();
    const userLoginCounts = this.groupByField(logins, 'user_id');
    
    return Object.entries(userLoginCounts)
      .map(([userId, count]) => ({
        user_id: parseInt(userId),
        login_count: count,
      }))
      .sort((a, b) => b.login_count - a.login_count)
      .slice(0, limit);
  }

  async getSessionDurationStats(): Promise<SessionDurationStats> {
    try {
      return await this.repo.getSessionDurationStatsOptimized();
    } catch (error) {
      const logins = await this.repo.findAll();
      const sessionsWithDuration = logins.filter((login: IUserLogin) => 
        login.session_duration_seconds !== null
      );
      
      if (sessionsWithDuration.length === 0) {
        return {
          totalSessions: 0,
          averageDuration: 0,
          minDuration: 0,
          maxDuration: 0,
          medianDuration: 0,
        };
      }

      const durations = sessionsWithDuration
        .map((login: IUserLogin) => login.session_duration_seconds!)
        .sort((a: number, b: number) => a - b);

      return {
        totalSessions: sessionsWithDuration.length,
        averageDuration: durations.reduce((sum: number, d: number) => sum + d, 0) / durations.length,
        minDuration: durations[0],
        maxDuration: durations[durations.length - 1],
        medianDuration: durations[Math.floor(durations.length / 2)],
      };
    }
  }

  async getLoginTrends(days: number = MyConfiguration.DEFAULT_LOGIN_TRENDS_DAYS()): Promise<LoginTrend[]> {
    // Add bounds checking for security
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      throw new Error('Days must be between 1 and 365');
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const logins = await this.repo.findByDateRange(startDate, endDate);
    const dailyStats = this.groupLoginsByDate(logins);

    const trends: LoginTrend[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      trends.push({
        date: dateKey,
        loginCount: dailyStats[dateKey] || 0,
      });
    }

    return trends;
  }

  async getPeakHoursAnalysis(): Promise<PeakHourAnalysis[]> {
    const logins = await this.repo.findAll();
    const hourlyStats: { [hour: number]: number } = {};

    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourlyStats[i] = 0;
    }

    logins.forEach((login: IUserLogin) => {
      const hour = new Date(login.login_time).getHours();
      hourlyStats[hour]++;
    });

    return Object.entries(hourlyStats)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        loginCount: count,
      }))
      .sort((a, b) => b.loginCount - a.loginCount);
  }

  async getDeviceTypeStats(): Promise<{ device_type: string; count: number }[]> {
    return this.statsCache.getDeviceStats();
  }

  async getRegionStats(): Promise<{ region: string; count: number }[]> {
    return this.statsCache.getRegionStats();
  }

  async getBrowserStats(): Promise<{ browser: string; count: number }[]> {
    return this.statsCache.getBrowserStats();
  }

  private calculateAverageSessionDuration(logins: IUserLogin[]): number {
    const sessionsWithDuration = logins.filter((login: IUserLogin) => 
      login.session_duration_seconds !== null
    );
    
    if (sessionsWithDuration.length === 0) return 0;
    
    const totalDuration = sessionsWithDuration.reduce(
      (sum: number, login: IUserLogin) => sum + (login.session_duration_seconds || 0), 
      0
    );
    
    return totalDuration / sessionsWithDuration.length;
  }

  private groupLoginsByDate(logins: IUserLogin[]): { [date: string]: number } {
    return logins.reduce((acc, login) => {
      const date = new Date(login.login_time).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as { [date: string]: number });
  }

  private groupByField<T extends keyof IUserLogin>(
    logins: IUserLogin[], 
    field: T
  ): { [key: string]: number } {
    return logins.reduce((acc, login) => {
      const value = String(login[field]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }
}
