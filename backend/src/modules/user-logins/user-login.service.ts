import { Injectable } from '@nestjs/common';
import { UserLoginRepository } from './user-login.repository';
import { BrowserStats, DeviceStats, RegionStats, SessionStats } from '../stats/stats.interface';
import { UserLogin } from '../../generated/prisma';
import { UserLoginCreate } from './user-login.interface';

@Injectable()
export class UserLoginService {
    constructor(private readonly userLoginRepository: UserLoginRepository) {}

    createUserLogin(data: UserLoginCreate): Promise<UserLogin> {
        return this.userLoginRepository.createUserLogin(data);
    }

    createUserLogins(data: UserLoginCreate[]): Promise<{ count: number }> {
        return this.userLoginRepository.createUserLogins(data);
    }

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
