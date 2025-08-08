export interface StatsUpdatedEvent {
  deviceStats: { device_type: string; count: number }[];
  regionStats: { region: string; count: number }[];
  browserStats: { browser: string; count: number }[];
  timestamp: Date;
}

export const STATS_EVENTS = {
  STATS_UPDATED: 'stats.updated',
  CACHE_INVALIDATED: 'cache.invalidated',
} as const;
