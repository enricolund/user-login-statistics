import { UserLogin } from '../../generated/prisma';
import { DeviceStats, RegionStats, BrowserStats, SessionStats } from '../stats/stats.interface';
import { UserLoginCreate } from './user-login.interface';

export interface UserLoginRepositoryInterface {
  createUserLogin(data: UserLoginCreate): Promise<UserLogin>;
  createUserLogins(data: UserLoginCreate[]): Promise<{ count: number }>;
  getDeviceTypeStats(): Promise<DeviceStats[]>;
  getRegionStats(): Promise<RegionStats[]>;
  getBrowserStats(): Promise<BrowserStats[]>;
  getSessionStats(): Promise<SessionStats>;
}
