import { IUserLogin } from '../dto/user-login.dto';
import { UserLoginStats, SessionDurationStats, LoginTrend, PeakHourAnalysis } from './stats.interface';

export interface TopActiveUser {
  user_id: number;
  login_count: number;
}

export interface IUserLoginService {
  findAll(): Promise<IUserLogin[]>;
  create(dto: IUserLogin.ICreate): Promise<IUserLogin>;
  generateUserLoginData(): Promise<IUserLogin[]>;
  getLoginStatsByDateRange(startDate: Date, endDate: Date): Promise<UserLoginStats>;
  getTopActiveUsers(limit?: number): Promise<TopActiveUser[]>;
  getSessionDurationStats(): Promise<SessionDurationStats>;
  getLoginTrends(days?: number): Promise<LoginTrend[]>;
  getPeakHoursAnalysis(): Promise<PeakHourAnalysis[]>;
  getDeviceTypeStats(): Promise<{ device_type: string; count: number }[]>;
  getRegionStats(): Promise<{ region: string; count: number }[]>;
  getBrowserStats(): Promise<{ browser: string; count: number }[]>;
}
