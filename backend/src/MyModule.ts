import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { HealthCheckController } from './controllers/health-check.controller';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { HealthCheckService } from './services/health-check.service';
import { PrismaService } from './services/prisma.service';

@Module({
  controllers: [HealthCheckController],
  providers: [PrismaService, HealthCheckService],
  imports: [
    EventEmitterModule.forRoot(),
    CacheModule.register({ isGlobal: true }),
    ScheduleModule.forRoot(),
    WebsocketModule,
  ],
})
export class MyModule {}
