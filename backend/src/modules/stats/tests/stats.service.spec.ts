import { StatsService } from '../stats.service';

describe('StatsService', () => {
  let service: StatsService;
  let cacheService: any;
  let userLoginService: any;

  beforeEach(() => {
    cacheService = {
      set: jest.fn(),
      get: jest.fn(),
    };
    userLoginService = {
      getDeviceTypeStats: jest.fn(),
      getRegionStats: jest.fn(),
      getSessionStats: jest.fn(),
    };
    service = new StatsService(cacheService, userLoginService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should warm up cache on module init', async () => {
    userLoginService.getDeviceTypeStats.mockResolvedValue(['device']);
    userLoginService.getRegionStats.mockResolvedValue(['region']);
    userLoginService.getSessionStats.mockResolvedValue('session');
    await service.onModuleInit();
    expect(cacheService.set).toHaveBeenCalledWith('statsData', {
      deviceStats: ['device'],
      regionDeviceStats: ['region'],
      sessionStats: 'session',
    });
  });

  it('should get updated stats and set cache', async () => {
    userLoginService.getDeviceTypeStats.mockResolvedValue(['d']);
    userLoginService.getRegionStats.mockResolvedValue(['r']);
    userLoginService.getSessionStats.mockResolvedValue('s');
    const result = await service.getUpdatedStats();
    expect(cacheService.set).toHaveBeenCalledWith('statsData', {
      deviceStats: ['d'],
      regionDeviceStats: ['r'],
      sessionStats: 's',
    });
    expect(result).toEqual({
      deviceStats: ['d'],
      regionDeviceStats: ['r'],
      sessionStats: 's',
    });
  });

  it('should return cached stats if available', async () => {
    cacheService.get.mockResolvedValue({
      deviceStats: ['d'],
      regionDeviceStats: ['r'],
      sessionStats: 's',
    });
    const result = await service.getAggregatedStats();
    expect(result).toEqual({
      deviceStats: ['d'],
      regionDeviceStats: ['r'],
      sessionStats: 's',
    });
  });

  it('should fetch fresh stats if cache is empty', async () => {
    cacheService.get.mockResolvedValue(undefined);
    userLoginService.getDeviceTypeStats.mockResolvedValue(['d']);
    userLoginService.getRegionStats.mockResolvedValue(['r']);
    userLoginService.getSessionStats.mockResolvedValue('s');
    const result = await service.getAggregatedStats();
    expect(result).toEqual({
      deviceStats: ['d'],
      regionDeviceStats: ['r'],
      sessionStats: 's',
    });
    expect(cacheService.set).toHaveBeenCalledWith('statsData', {
      deviceStats: ['d'],
      regionDeviceStats: ['r'],
      sessionStats: 's',
    });
  });
});
