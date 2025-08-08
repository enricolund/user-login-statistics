import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WebSocketServer } from '../websocket/websocket-server';
import { StatsCacheService } from './stats-cache.service';

@Injectable()
export class StatsAggregationService implements OnModuleInit {
  private readonly logger = new Logger(StatsAggregationService.name);

  constructor(
    private readonly statsCache: StatsCacheService,
    private readonly wsServer: WebSocketServer
  ) {}

  onModuleInit() {
    this.logger.log('Stats aggregation service initialized');
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleStatsAggregation() {
    try {
      await this.statsCache.refreshCache();

      if (!this.wsServer) {
        this.logger.debug('WebSocket server not available');
        return;
      }

      const activeConnections = this.wsServer.getActiveConnectionCount();
      
      if (activeConnections > 0) {
        this.logger.log(`Broadcasting to ${activeConnections} clients`);
        await this.wsServer.broadcastStatsUpdate();
      } else {
        this.logger.debug('No active connections');
      }
    } catch (error) {
      this.logger.error('Error in stats aggregation:', error);
    }
  }

  async triggerStatsUpdate(): Promise<void> {
    this.logger.log('Triggering stats update');
    await this.statsCache.refreshCache();
    if (this.wsServer) {
      await this.wsServer.broadcastStatsUpdate();
    }
  }

  getCacheInfo() {
    return this.statsCache.getCacheInfo();
  }
}
