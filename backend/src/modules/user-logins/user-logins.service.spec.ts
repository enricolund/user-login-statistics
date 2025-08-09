import { Test, TestingModule } from '@nestjs/testing';
import { UserLoginsService } from './user-logins.service';

describe('UserLoginsService', () => {
  let service: UserLoginsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserLoginsService],
    }).compile();

    service = module.get<UserLoginsService>(UserLoginsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
