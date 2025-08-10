import { Module } from '@nestjs/common';

import { GenerateUserLoginData } from '../../generators/generate-user-login-data';
import { PrismaService } from '../../services/prisma.service';
import { CacheService } from '../../services/stats-cache.service';
import { UserLoginRepository } from './user-login.repository';
import { UserLoginService } from './user-login.service';

@Module({
  controllers: [],
  imports: [],
  providers: [
    CacheService,
    UserLoginService,
    UserLoginRepository,
    PrismaService,
    GenerateUserLoginData,
  ],
  exports: [UserLoginService],
})
export class UserLoginsModule {}
