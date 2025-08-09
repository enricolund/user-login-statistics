import { Module } from "@nestjs/common";
import { EventEmitterModule } from '@nestjs/event-emitter';

// import { UserLoginModule } from "./modules/user-login.module";
// import { WebSocketModule } from "./websocket/websocket.module";
import { WebsocketModule } from "./modules/websocket/websocket.module";
import { CacheModule } from "@nestjs/cache-manager";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    CacheModule.register({ isGlobal: true }),
    ScheduleModule.forRoot(),
    WebsocketModule,
  ],
})
export class MyModule {}
