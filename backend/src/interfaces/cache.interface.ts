import { DeviceStats, RegionStats, BrowserStats } from './stats.interface';

export interface CacheInfo {
  isCached: boolean;
  lastUpdated: Date | null;
  isExpired: boolean;
  cacheAgeMs: number | null;
}

export interface CachedStats {
  deviceStats: DeviceStats[];
  regionStats: RegionStats[];
  browserStats: BrowserStats[];
  lastUpdated: Date;
}

export interface IStatsCacheService {
  getDeviceStats(): Promise<DeviceStats[]>;
  getRegionStats(): Promise<RegionStats[]>;
  getBrowserStats(): Promise<BrowserStats[]>;
  getAllStats(): Promise<{
    deviceStats: DeviceStats[];
    regionStats: RegionStats[];
    browserStats: BrowserStats[];
  }>;
  refreshCache(): Promise<void>;
  invalidateCache(): Promise<void>;
  getCacheInfo(): CacheInfo;
}
