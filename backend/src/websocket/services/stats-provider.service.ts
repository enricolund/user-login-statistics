import { Injectable, Logger } from '@nestjs/common';
import { UserLoginService } from '../../services/user-login.service';
import { StatsData } from '../interfaces/websocket.interfaces';

@Injectable()
export class StatsProvider {
  private readonly logger = new Logger(StatsProvider.name);

  constructor(private readonly userLoginService: UserLoginService) {}

  public async getAggregatedStats(): Promise<StatsData> {
    try {
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
    } catch (error) {
      this.logger.error('Error getting aggregated stats:', error);
      throw error;
    }
  }

  public async getStatsResponse(): Promise<any> {
    const statsData = await this.getAggregatedStats();
    return {
      type: 'stats_update',
      payload: statsData,
      timestamp: new Date().toISOString()
    };
  }
}
