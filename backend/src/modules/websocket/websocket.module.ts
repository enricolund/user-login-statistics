import { Module } from '@nestjs/common';
import { WebsocketService } from './websocket.service';
import { WebsocketGateway } from './websocket.gateway';
import { StatsModule } from '../stats/stats.module';

@Module({
  imports: [StatsModule],
  providers: [WebsocketGateway, WebsocketService],
})
export class WebsocketModule {}
