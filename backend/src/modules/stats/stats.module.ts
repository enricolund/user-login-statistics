import { Logger, Module } from '@nestjs/common';
import { StatsService } from './stats.service';
import { UserLoginsModule } from '../user-logins/user-login.module';

@Module({
  imports: [UserLoginsModule],
  providers: [Logger, StatsService],
  exports: [StatsService],
})
export class StatsModule {}
