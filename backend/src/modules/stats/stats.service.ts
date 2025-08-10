import { Injectable, OnModuleInit } from '@nestjs/common';
import { Stats } from './stats.interface';
import { UserLoginService } from '../user-logins/user-login.service';
import { CacheService } from '../../services/stats-cache.service';

@Injectable()
export class StatsService implements OnModuleInit {
    constructor(
        private readonly cacheService: CacheService,
        private readonly userLoginService: UserLoginService
    ) {}

    async onModuleInit() {
        // warm up the cache with initial stats data
        const result = await this.getAggregatedStats();
        await this.cacheService.set<Stats>('statsData', result);
        console.log('StatsService initialized and cached initial stats data');
    }

    async getUpdatedStats(): Promise<Stats> {
        console.log('Updating stats');
        const result = await Promise.all([
            this.userLoginService.getDeviceTypeStats(),
            this.userLoginService.getRegionStats(),
            this.userLoginService.getSessionStats(),
        ]).then(([deviceStats, regionDeviceStats, sessionStats]) => ({
            deviceStats,
            regionDeviceStats,
            sessionStats,
        }));
        await this.cacheService.set<Stats>('statsData', result);
        return result;
    }

    async getAggregatedStats(): Promise<Stats> {
        const cachedData = await this.cacheService.get<Stats>('statsData');
        if (cachedData) {
            console.log('Returning cached stats data');
            return cachedData;
        }

        const freshData = await this.getUpdatedStats();
        console.log('Returning fresh stats data');
        return freshData;
    }
}
