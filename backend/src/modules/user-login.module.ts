import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UserLoginService } from '../services/user-login.service';
import { UserLoginController } from '../controllers/user-login.controller';
import { HealthCheckController } from '../controllers/health-check.controller';
import { UserLoginRepository } from '../repositories/user-login.repository';
import { PrismaService } from '../services/prisma.service';
import { StatsAggregationService } from '../services/stats-aggregation.service';
import { StatsCacheService } from '../services/stats-cache.service';
import { HealthCheckService } from '../services/health-check.service';
import { StatsModule } from './stats/stats.module';
import { UserLoginsModule } from './user-logins/user-logins.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    StatsModule,
    UserLoginsModule,
  ],
  controllers: [UserLoginController, HealthCheckController],
  providers: [
    UserLoginService, 
    UserLoginRepository, 
    PrismaService, 
    StatsAggregationService,
    StatsCacheService,
    HealthCheckService,
  ],
  exports: [
    UserLoginService, 
    StatsAggregationService, 
    StatsCacheService, 
    HealthCheckService,
  ],
})
export class UserLoginModule {}