import { Module } from '@nestjs/common';
import { UserLoginsService } from './user-logins.service';
import { UserLoginsController } from './user-logins.controller';

@Module({
  controllers: [UserLoginsController],
  providers: [UserLoginsService],
})
export class UserLoginsModule {}
