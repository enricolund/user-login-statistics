import { Module } from '@nestjs/common';

import { CacheService } from '../../services/stats-cache.service';
import { StatsModule } from '../stats/stats.module';
import { WebsocketClientManager } from './services/websocket-client.manager';
import { WebsocketMessageHandler } from './services/websocket-message.handler';
import { WebsocketService } from './services/websocket.service';
import { WebsocketGateway } from './websocket.gateway';

@Module({
  imports: [StatsModule],
  providers: [
    CacheService,
    WebsocketGateway,
    WebsocketService,
    WebsocketClientManager,
    WebsocketMessageHandler,
  ],
})
export class WebsocketModule {}
