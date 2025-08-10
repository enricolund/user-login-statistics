import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { CacheService } from '../../services/stats-cache.service';
import { UserLoginService } from '../user-logins/user-login.service';
import { Stats } from './stats.interface';

@Injectable()
export class StatsService implements OnModuleInit {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly userLoginService: UserLoginService,
  ) {}

  async onModuleInit() {
    this.logger.log('Warming up stats cache...');
    try {
      await this.warmUpCache();
      this.logger.log('Stats cache warmed up successfully');
    } catch (error) {
      this.logger.error('Failed to warm up stats cache:', error);
    }
  }

  private async warmUpCache(): Promise<void> {
    const stats = await this.fetchFreshStats();
    await this.cacheService.set<Stats>('statsData', stats);
  }

  private async fetchFreshStats(): Promise<Stats> {
    this.logger.log('Fetching fresh stats data');
    const [deviceStats, regionDeviceStats, sessionStats] = await Promise.all([
      this.userLoginService.getDeviceTypeStats(),
      this.userLoginService.getRegionStats(),
      this.userLoginService.getSessionStats(),
    ]);

    return {
      deviceStats,
      regionDeviceStats,
      sessionStats,
    };
  }

  async getUpdatedStats(): Promise<Stats> {
    const stats = await this.fetchFreshStats();
    await this.cacheService.set<Stats>('statsData', stats);
    return stats;
  }

  async getAggregatedStats(): Promise<Stats> {
    const cachedData = await this.cacheService.get<Stats>('statsData');
    if (cachedData) {
      this.logger.debug('Returning cached stats data');
      return cachedData;
    }

    this.logger.log('Cache miss - fetching fresh stats data');
    return this.getUpdatedStats();
  }
}
