import { Injectable } from '@nestjs/common';
import { UserLoginRepository } from './user-login.repository';
import { BrowserStats, DeviceStats, RegionStats, SessionStats } from '../stats/stats.interface';

@Injectable()
export class UserLoginService {
    constructor(private readonly userLoginRepository: UserLoginRepository) {}

    getRegionStats(): Promise<RegionStats[]> {
        return this.userLoginRepository.getRegionStats();
    }

    getDeviceTypeStats(): Promise<DeviceStats[]> {
        return this.userLoginRepository.getDeviceTypeStats();
    }

    getBrowserStats(): Promise<BrowserStats[]> {
        return this.userLoginRepository.getBrowserStats();
    }

    getSessionStats(): Promise<SessionStats> {
        return this.userLoginRepository.getSessionStats();
    }
}
