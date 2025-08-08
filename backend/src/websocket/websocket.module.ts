import { Global, Module } from '@nestjs/common';
import { WebSocketServer } from './websocket-server';
import { UserLoginModule } from '../modules/user-login.module';

@Global()
@Module({
  imports: [UserLoginModule],
  providers: [WebSocketServer],
  exports: [WebSocketServer],
})
export class WebSocketModule {}
