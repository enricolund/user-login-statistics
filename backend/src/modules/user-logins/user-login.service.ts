import { Injectable } from '@nestjs/common';

import { UserLogin } from '../../generated/prisma';
import { CacheService } from '../../services/stats-cache.service';
import { BrowserStats, DeviceStats, RegionStats, SessionStats } from '../stats/stats.interface';
import { UserLoginCreate } from './user-login.interface';
import { UserLoginRepository } from './user-login.repository';

@Injectable()
export class UserLoginService {
  constructor(
    private readonly cacheManager: CacheService,
    private readonly userLoginRepository: UserLoginRepository,
  ) {}

  async createUserLogin(data: UserLoginCreate): Promise<UserLogin> {
    const result = await this.userLoginRepository.createUserLogin(data);
    await this.cacheManager.del('statsData');
    return result;
  }

  async createUserLogins(data: UserLoginCreate[]): Promise<{ count: number }> {
    const result = await this.userLoginRepository.createUserLogins(data);
    await this.cacheManager.del('statsData');
    return result;
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
