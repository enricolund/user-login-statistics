import { DeviceStats, RegionStats, BrowserStats, SessionStats } from '../stats/stats.interface';

export interface UserLoginRepositoryInterface {
  getDeviceTypeStats(): Promise<DeviceStats[]>;
  getRegionStats(): Promise<RegionStats[]>;
  getBrowserStats(): Promise<BrowserStats[]>;
  getSessionStats(): Promise<SessionStats>;
}
