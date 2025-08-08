import { Module } from "@nestjs/common";
import { EventEmitterModule } from '@nestjs/event-emitter';

import { UserLoginModule } from "./modules/user-login.module";
import { WebSocketModule } from "./websocket/websocket.module";

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    UserLoginModule,
    WebSocketModule,
  ],
})
export class MyModule {}
