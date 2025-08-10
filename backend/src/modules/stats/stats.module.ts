import { Logger, Module } from '@nestjs/common';

import { CacheService } from '../../services/stats-cache.service';
import { UserLoginsModule } from '../user-logins/user-login.module';
import { StatsService } from './stats.service';

@Module({
  imports: [UserLoginsModule],
  providers: [CacheService, Logger, StatsService],
  exports: [StatsService],
})
export class StatsModule {}
