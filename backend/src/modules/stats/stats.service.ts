import { Injectable } from '@nestjs/common';
import { Stats } from './stats.interface';
import { UserLoginService } from '../user-logins/user-login.service';

@Injectable()
export class StatsService {
    constructor(private readonly userLoginService: UserLoginService) {}

    async getAllStats(): Promise<Stats> {
        return Promise.all([
            this.userLoginService.getDeviceTypeStats(),
            this.userLoginService.getRegionStats(),
            this.userLoginService.getSessionStats(),
        ]).then(([deviceStats, regionDeviceStats, sessionStats]) => ({
            deviceStats,
            regionDeviceStats,
            sessionStats,
        }));
    }
}
