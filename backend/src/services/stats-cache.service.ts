import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserLoginRepository } from '../repositories/user-login.repository';
import { STATS_EVENTS } from '../events/stats-events';
import { MyConfiguration } from '../MyConfiguration';
import { IStatsCacheService, CacheInfo } from '../interfaces/cache.interface';

interface CachedStats {
  deviceStats: { device_type: string; count: number }[];
  regionStats: { region: string; count: number }[];
  browserStats: { browser: string; count: number }[];
  lastUpdated: Date;
}

@Injectable()
export class StatsCacheService implements OnModuleInit, IStatsCacheService {
  private readonly logger = new Logger(StatsCacheService.name);
  private cachedStats: CachedStats | null = null;
  private readonly CACHE_TTL_MS = MyConfiguration.CACHE_TTL_MS();

  constructor(
    private readonly userLoginRepo: UserLoginRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    this.logger.log('Warming up cache...');
    try {
      await this.refreshCache();
      this.logger.log('Cache warmed up');
    } catch (error) {
      this.logger.error('Failed to warm up cache:', error);
    }
  }

  async getDeviceStats(): Promise<{ device_type: string; count: number }[]> {
    const stats = await this.getCachedStats();
    return stats.deviceStats;
  }

  async getRegionStats(): Promise<{ region: string; count: number }[]> {
    const stats = await this.getCachedStats();
    return stats.regionStats;
  }

  async getBrowserStats(): Promise<{ browser: string; count: number }[]> {
    const stats = await this.getCachedStats();
    return stats.browserStats;
  }

  async getAllStats(): Promise<{
    deviceStats: { device_type: string; count: number }[];
    regionStats: { region: string; count: number }[];
    browserStats: { browser: string; count: number }[];
  }> {
    const stats = await this.getCachedStats();
    return {
      deviceStats: stats.deviceStats,
      regionStats: stats.regionStats,
      browserStats: stats.browserStats,
    };
  }

  async refreshCache(): Promise<void> {
    this.logger.log('Refreshing cache...');
    
    try {
      const [deviceStats, regionStats, browserStats] = await Promise.all([
        this.userLoginRepo.getDeviceTypeCounts(),
        this.userLoginRepo.getRegionCounts(),
        this.userLoginRepo.getBrowserCounts(),
      ]);

      this.cachedStats = {
        deviceStats,
        regionStats,
        browserStats,
        lastUpdated: new Date(),
      };

      this.logger.log('Cache refreshed');
    } catch (error) {
      this.logger.error('Failed to refresh cache:', error);
      throw error;
    }
  }

  async invalidateCache(): Promise<void> {
    this.logger.log('Invalidating cache');
    this.cachedStats = null;
    this.eventEmitter.emit(STATS_EVENTS.CACHE_INVALIDATED);
  }

  private async getCachedStats(): Promise<CachedStats> {
    if (!this.cachedStats || this.isCacheExpired()) {
      await this.refreshCache();
    }
    return this.cachedStats!;
  }

  private isCacheExpired(): boolean {
    if (!this.cachedStats) return true;
    
    const now = new Date();
    const cacheAge = now.getTime() - this.cachedStats.lastUpdated.getTime();
    return cacheAge > this.CACHE_TTL_MS;
  }

  getCacheInfo(): CacheInfo { 
    if (!this.cachedStats) {
      return {
        isCached: false,
        lastUpdated: null,
        isExpired: true,
        cacheAgeMs: null,
      };
    }

    const now = new Date();
    const cacheAgeMs = now.getTime() - this.cachedStats.lastUpdated.getTime();

    return {
      isCached: true,
      lastUpdated: this.cachedStats.lastUpdated,
      isExpired: this.isCacheExpired(),
      cacheAgeMs,
    };
  }
}
