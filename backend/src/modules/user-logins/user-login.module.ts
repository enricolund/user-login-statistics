import { Module } from '@nestjs/common';
import { UserLoginService } from './user-login.service';
import { UserLoginRepository } from './user-login.repository';
import { PrismaService } from '../../services/prisma.service';
import { GenerateUserLoginData } from '../../generators/generate-user-login-data';
import { CacheService } from '../../services/stats-cache.service';

@Module({
  controllers: [],
  imports: [],
  providers: [CacheService, UserLoginService, UserLoginRepository, PrismaService, GenerateUserLoginData],
  exports: [UserLoginService],
})
export class UserLoginsModule {}
