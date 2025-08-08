import { DeviceStats, RegionStats, BrowserStats, SessionDurationStats } from './stats.interface';

export interface IStatsRepository {
  getDeviceTypeCounts(): Promise<DeviceStats[]>;
  getRegionCounts(): Promise<RegionStats[]>;
  getBrowserCounts(): Promise<BrowserStats[]>;
  getSessionDurationStatsOptimized(): Promise<SessionDurationStats>;
}
