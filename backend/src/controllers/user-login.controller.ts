import { Controller, Injectable } from "@nestjs/common";
import { UserLoginService } from "../services/user-login.service";
import { StatsAggregationService } from "../services/stats-aggregation.service";
import { TypedRoute, TypedBody } from "@nestia/core";
import { IUserLogin } from "../dto/user-login.dto";

@Controller('logins')
@Injectable()
export class UserLoginController {
  constructor(
    private readonly userLoginService: UserLoginService,
    private readonly statsAggregationService: StatsAggregationService,
  ) {}

  @TypedRoute.Get()
  findAll() {
    return this.userLoginService.findAll();
  }

  @TypedRoute.Post()
  createLogin(@TypedBody() data: IUserLogin.ICreate): Promise<IUserLogin> {
    return this.userLoginService.create(data);
  }

  @TypedRoute.Post('fake')
  generateFakeUserLoginData() {
    return this.userLoginService.generateUserLoginData();
  }

  @TypedRoute.Get('cache-status')
  getCacheStatus(): {
    isCached: boolean;
    lastUpdated: Date | null;
    isExpired: boolean;
    cacheAgeMs: number | null;
  } {
    return this.statsAggregationService.getCacheInfo();
  }

  @TypedRoute.Get('stats')
  async getStats(): Promise<{
    totalSessions: number;
    totalUsers: number;
    averageSessionDuration: number;
    deviceStats: { device_type: string; count: number }[];
    regionStats: { region: string; count: number }[];
    browserStats: { browser: string; count: number }[];
  }> {
    const [deviceStats, regionStats, browserStats, allLogins] = await Promise.all([
      this.userLoginService.getDeviceTypeStats(),
      this.userLoginService.getRegionStats(), 
      this.userLoginService.getBrowserStats(),
      this.userLoginService.findAll(),
    ]);

    // Calculate basic metrics
    const totalSessions = allLogins.length;
    const totalUsers = new Set(allLogins.map(login => login.user_id)).size;
    
    // Calculate average session duration for sessions that have duration
    const sessionsWithDuration = allLogins.filter(login => login.session_duration_seconds !== null);
    const averageSessionDuration = sessionsWithDuration.length > 0 
      ? sessionsWithDuration.reduce((sum, login) => sum + (login.session_duration_seconds || 0), 0) / sessionsWithDuration.length
      : 0;

    return {
      totalSessions,
      totalUsers,
      averageSessionDuration,
      deviceStats,
      regionStats,
      browserStats,
    };
  }

  @TypedRoute.Post('trigger-update')
  async triggerStatsUpdate(): Promise<{ message: string }> {
    await this.statsAggregationService.triggerStatsUpdate();
    return { message: 'Stats update triggered successfully' };
  }
}