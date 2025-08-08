import { Controller } from '@nestjs/common';
import { TypedRoute } from '@nestia/core';
import { UserLoginGateway } from '../websocket/user-login-gateway';
import { StatsAggregationService } from '../services/stats-aggregation.service';

@Controller('websocket')
export class WebSocketController {
  constructor(
    private readonly userLoginGateway: UserLoginGateway,
    private readonly statsAggregationService: StatsAggregationService,
  ) {}

  @TypedRoute.Get('status')
  getWebSocketStatus(): { activeConnections: number; clientIds: string[] } {
    return {
      activeConnections: this.userLoginGateway.getActiveConnectionCount(),
      clientIds: this.userLoginGateway.getActiveClientIds(),
    };
  }

  @TypedRoute.Post('broadcast')
  async triggerBroadcast(): Promise<{ message: string; activeConnections: number }> {
    await this.statsAggregationService.triggerStatsUpdate();
    return {
      message: 'Stats broadcast triggered',
      activeConnections: this.userLoginGateway.getActiveConnectionCount(),
    };
  }
}
