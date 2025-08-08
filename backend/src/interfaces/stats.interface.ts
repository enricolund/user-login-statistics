export interface UserLoginStats {
  totalLogins: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  loginsPerDay: { [date: string]: number };
  deviceTypeDistribution: { [key: string]: number };
  browserDistribution: { [key: string]: number };
  regionDistribution: { [key: string]: number };
}

export interface SessionDurationStats {
  totalSessions: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  medianDuration: number;
}

export interface LoginTrend {
  date: string;
  loginCount: number;
}

export interface PeakHourAnalysis {
  hour: number;
  loginCount: number;
}

export interface DeviceStats {
  device_type: string;
  count: number;
}

export interface RegionStats {
  region: string;
  count: number;
}

export interface BrowserStats {
  browser: string;
  count: number;
}
