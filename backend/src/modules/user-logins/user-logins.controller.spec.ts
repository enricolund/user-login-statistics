import { Test, TestingModule } from '@nestjs/testing';
import { UserLoginsController } from './user-logins.controller';
import { UserLoginsService } from './user-logins.service';

describe('UserLoginsController', () => {
  let controller: UserLoginsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserLoginsController],
      providers: [UserLoginsService],
    }).compile();

    controller = module.get<UserLoginsController>(UserLoginsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
