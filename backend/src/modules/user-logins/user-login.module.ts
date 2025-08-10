import { Module } from '@nestjs/common';
import { UserLoginService } from './user-login.service';
import { UserLoginRepository } from './user-login.repository';
import { PrismaService } from '../../services/prisma.service';

@Module({
  controllers: [],
  providers: [UserLoginService, UserLoginRepository, PrismaService],
  exports: [UserLoginService],
})
export class UserLoginsModule {}
