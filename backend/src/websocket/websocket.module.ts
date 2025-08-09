import { Global, Module } from '@nestjs/common';
import { WebSocketServer } from './websocket-server';
import { UserLoginModule } from '../modules/user-login.module';
import { ClientManager } from './services/client-manager.service';
import { MessageHandler } from './services/message-handler.service';
import { StatsProvider } from './services/stats-provider.service';

@Global()
@Module({
  imports: [UserLoginModule],
  providers: [
    WebSocketServer,
    ClientManager,
    MessageHandler,
    StatsProvider,
  ],
  exports: [WebSocketServer],
})
export class WebSocketModule2 {}
