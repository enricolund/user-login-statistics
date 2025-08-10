import { Logger, Module } from '@nestjs/common';
import { StatsService } from './stats.service';
import { UserLoginsModule } from '../user-logins/user-login.module';
import { CacheService } from '../../services/stats-cache.service';

@Module({
  imports: [UserLoginsModule],
  providers: [CacheService, Logger, StatsService],
  exports: [StatsService],
})
export class StatsModule {}
