import { Module } from '@nestjs/common';
import { WebsocketService } from './websocket.service';
import { WebsocketGateway } from './websocket.gateway';
import { StatsModule } from '../stats/stats.module';
import { CacheService } from '../../services/stats-cache.service';

@Module({
  imports: [StatsModule],
  providers: [WebsocketGateway, WebsocketService, CacheService],
})
export class WebsocketModule {}
