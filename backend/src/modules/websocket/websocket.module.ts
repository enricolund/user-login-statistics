import { Module } from '@nestjs/common';
import { WebsocketService } from './services/websocket.service';
import { WebsocketGateway } from './websocket.gateway';
import { StatsModule } from '../stats/stats.module';
import { CacheService } from '../../services/stats-cache.service';
import { WebsocketClientManager } from './services/websocket-client.manager';
import { WebsocketMessageHandler } from './services/websocket-message.handler';

@Module({
  imports: [StatsModule],
  providers: [CacheService, WebsocketGateway, WebsocketService, WebsocketClientManager, WebsocketMessageHandler],
})
export class WebsocketModule {}
