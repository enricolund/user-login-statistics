import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserLoginService } from '../../src/services/user-login.service';
import { UserLoginRepository } from '../../src/repositories/user-login.repository';
import { StatsCacheService } from '../../src/services/stats-cache.service';
import { IUserLogin } from '../../src/dto/user-login.dto';
import { STATS_EVENTS } from '../../src/events/stats-events';

describe('UserLoginService', () => {
  let service: UserLoginService;
  let mockRepository: jest.Mocked<UserLoginRepository>;
  let mockStatsCache: jest.Mocked<StatsCacheService>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  const mockUserLogin: IUserLogin = {
    id: 1,
    user_id: 123,
    login_time: '2024-01-15T10:30:00.000Z',
    logout_time: '2024-01-15T12:30:00.000Z',
    session_duration_seconds: 7200,
    ip_address: '192.168.1.100',
    device_type: 'Desktop',
    browser: 'Chrome',
    region: 'Estonia',
    created_at: '2024-01-15T10:30:00.000Z',
    updated_at: '2024-01-15T10:30:00.000Z'
  };

  const mockCreateDto: IUserLogin.ICreate = {
    user_id: 123,
    login_time: '2024-01-15T10:30:00.000Z',
    logout_time: '2024-01-15T12:30:00.000Z',
    session_duration_seconds: 7200,
    ip_address: '192.168.1.100',
    device_type: 'Desktop',
    browser: 'Chrome',
    region: 'Estonia'
  };

  beforeEach(async () => {
    // Create mock objects
    mockRepository = {
      findAll: jest.fn(),
      create: jest.fn(),
      findByDateRange: jest.fn(),
      findByUserId: jest.fn(),
      getDeviceTypeCounts: jest.fn(),
      getRegionCounts: jest.fn(),
      getBrowserCounts: jest.fn(),
      getSessionDurationStatsOptimized: jest.fn(),
    } as unknown as jest.Mocked<UserLoginRepository>;

    mockStatsCache = {
      getDeviceStats: jest.fn(),
      getRegionStats: jest.fn(),
      getBrowserStats: jest.fn(),
      getAllStats: jest.fn(),
      refreshCache: jest.fn(),
      invalidateCache: jest.fn(),
      getCacheInfo: jest.fn(),
    } as unknown as jest.Mocked<StatsCacheService>;

    mockEventEmitter = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserLoginService,
        {
          provide: UserLoginRepository,
          useValue: mockRepository,
        },
        {
          provide: StatsCacheService,
          useValue: mockStatsCache,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<UserLoginService>(UserLoginService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all user login records from repository', async () => {
      // Arrange
      const mockResults = [mockUserLogin, { ...mockUserLogin, id: 2, user_id: 456 }];
      mockRepository.findAll.mockResolvedValue(mockResults);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(mockResults);
    });
  });

  describe('create', () => {
    it('should create a user login and emit cache invalidation event', async () => {
      // Arrange
      mockRepository.create.mockResolvedValue(mockUserLogin);

      // Act
      const result = await service.create(mockCreateDto);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(mockCreateDto);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(STATS_EVENTS.CACHE_INVALIDATED);
      expect(result).toEqual(mockUserLogin);
    });
  });

  describe('getLoginStatsByDateRange', () => {
    it('should return aggregated statistics for date range', async () => {
      // Arrange
      const startDate = new Date('2024-01-15T00:00:00.000Z');
      const endDate = new Date('2024-01-15T23:59:59.999Z');
      const mockLogins = [
        mockUserLogin,
        { ...mockUserLogin, id: 2, user_id: 456, device_type: 'mobile' },
        { ...mockUserLogin, id: 3, user_id: 789, device_type: 'tablet' }
      ];

      mockRepository.findByDateRange.mockResolvedValue(mockLogins);

      // Act
      const result = await service.getLoginStatsByDateRange(startDate, endDate);

      // Assert
      expect(mockRepository.findByDateRange).toHaveBeenCalledWith(startDate, endDate);
      expect(result.totalLogins).toBe(3);
      expect(result.uniqueUsers).toBe(3);
      expect(result.deviceTypeDistribution).toEqual({
        Desktop: 1,
        mobile: 1,
        tablet: 1
      });
      expect(result.regionDistribution).toEqual({
        Estonia: 3
      });
    });

    it('should handle empty results gracefully', async () => {
      // Arrange
      const startDate = new Date('2024-01-15T00:00:00.000Z');
      const endDate = new Date('2024-01-15T23:59:59.999Z');
      mockRepository.findByDateRange.mockResolvedValue([]);

      // Act
      const result = await service.getLoginStatsByDateRange(startDate, endDate);

      // Assert
      expect(result.totalLogins).toBe(0);
      expect(result.uniqueUsers).toBe(0);
      expect(result.averageSessionDuration).toBe(0);
      expect(result.deviceTypeDistribution).toEqual({});
    });
  });

  describe('getDeviceTypeStats', () => {
    it('should return device type statistics from cache', async () => {
      // Arrange
      const mockDeviceStats = [
        { device_type: 'desktop', count: 150 },
        { device_type: 'mobile', count: 85 },
        { device_type: 'tablet', count: 12 }
      ];
      mockStatsCache.getDeviceStats.mockResolvedValue(mockDeviceStats);

      // Act
      const result = await service.getDeviceTypeStats();

      // Assert
      expect(result).toEqual(mockDeviceStats);
    });
  });
});
