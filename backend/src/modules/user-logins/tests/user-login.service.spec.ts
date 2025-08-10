import { CacheService } from '../../../services/stats-cache.service';
import { UserLoginRepository } from '../user-login.repository';
import { UserLoginService } from '../user-login.service';

describe('UserLoginService', () => {
  let service: UserLoginService;
  let repo: UserLoginRepository;
  let cache: CacheService;

  beforeEach(async () => {
    repo = {
      createUserLogin: jest.fn(),
      createUserLogins: jest.fn(),
      getRegionStats: jest.fn(),
      getDeviceTypeStats: jest.fn(),
      getBrowserStats: jest.fn(),
      getSessionStats: jest.fn(),
    } as any;
    cache = {
      del: jest.fn(),
    } as any;

    service = new UserLoginService(cache, repo);
  });

  it('should create a user login and invalidate cache', async () => {
    (repo.createUserLogin as jest.Mock).mockResolvedValue({ id: 1 });
    const result = await service.createUserLogin({ userId: 1 } as any);
    expect(repo.createUserLogin).toHaveBeenCalledWith({ userId: 1 });
    expect(cache.del).toHaveBeenCalledWith('statsData');
    expect(result).toEqual({ id: 1 });
  });

  it('should create multiple user logins and invalidate cache', async () => {
    (repo.createUserLogins as jest.Mock).mockResolvedValue({ count: 2 });
    const result = await service.createUserLogins([{ userId: 1 }, { userId: 2 }] as any);
    expect(repo.createUserLogins).toHaveBeenCalledWith([{ userId: 1 }, { userId: 2 }]);
    expect(cache.del).toHaveBeenCalledWith('statsData');
    expect(result).toEqual({ count: 2 });
  });

  it('should get region stats', async () => {
    (repo.getRegionStats as jest.Mock).mockResolvedValue([{ region: 'EU', count: 5 }]);
    const result = await service.getRegionStats();
    expect(repo.getRegionStats).toHaveBeenCalled();
    expect(result).toEqual([{ region: 'EU', count: 5 }]);
  });

  it('should get device type stats', async () => {
    (repo.getDeviceTypeStats as jest.Mock).mockResolvedValue([{ device_type: 'mobile', count: 3 }]);
    const result = await service.getDeviceTypeStats();
    expect(repo.getDeviceTypeStats).toHaveBeenCalled();
    expect(result).toEqual([{ device_type: 'mobile', count: 3 }]);
  });

  it('should get browser stats', async () => {
    (repo.getBrowserStats as jest.Mock).mockResolvedValue([{ browser: 'Chrome', count: 4 }]);
    const result = await service.getBrowserStats();
    expect(repo.getBrowserStats).toHaveBeenCalled();
    expect(result).toEqual([{ browser: 'Chrome', count: 4 }]);
  });

  it('should get session stats', async () => {
    (repo.getSessionStats as jest.Mock).mockResolvedValue({ active: 2 });
    const result = await service.getSessionStats();
    expect(repo.getSessionStats).toHaveBeenCalled();
    expect(result).toEqual({ active: 2 });
  });
});
