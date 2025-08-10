import { Module } from '@nestjs/common';
import { UserLoginService } from './user-login.service';
import { UserLoginRepository } from './user-login.repository';
import { PrismaService } from '../../services/prisma.service';
import { GenerateUserLoginData } from '../../generators/generate-user-login-data';

@Module({
  controllers: [],
  providers: [UserLoginService, UserLoginRepository, PrismaService, GenerateUserLoginData],
  exports: [UserLoginService],
})
export class UserLoginsModule {}
