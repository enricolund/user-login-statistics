import { Test, TestingModule } from '@nestjs/testing';
import { UserLoginRepository } from '../../src/repositories/user-login.repository';
import { PrismaService } from '../../src/services/prisma.service';
import { IUserLogin } from '../../src/dto/user-login.dto';

describe('UserLoginRepository', () => {
  let repository: UserLoginRepository;
  let prismaService: PrismaService;

  const mockUserLoginData: IUserLogin.ICreate = {
    user_id: 123,
    login_time: '2024-01-15T10:30:00.000Z',
    logout_time: '2024-01-15T12:30:00.000Z',
    session_duration_seconds: 7200,
    ip_address: '192.168.1.100',
    device_type: 'desktop',
    browser: 'Chrome',
    region: 'California'
  };

  const mockPrismaResult = {
    id: 1,
    user_id: 123,
    login_time: new Date('2024-01-15T10:30:00.000Z'),
    logout_time: new Date('2024-01-15T12:30:00.000Z'),
    session_duration_seconds: 7200,
    ip_address: '192.168.1.100',
    device_type: 'desktop',
    browser: 'Chrome',
    region: 'California',
    created_at: new Date('2024-01-15T10:30:00.000Z'),
    updated_at: new Date('2024-01-15T10:30:00.000Z')
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserLoginRepository,
        {
          provide: PrismaService,
          useValue: {
            userLogin: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<UserLoginRepository>(UserLoginRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user login record and return DTO format', async () => {
      // Arrange
      jest.spyOn(prismaService.userLogin, 'create').mockResolvedValue(mockPrismaResult);

      // Act
      const result = await repository.create(mockUserLoginData);

      // Assert
      expect(result).toEqual({
        id: 1,
        user_id: 123,
        login_time: '2024-01-15T10:30:00.000Z',
        logout_time: '2024-01-15T12:30:00.000Z',
        session_duration_seconds: 7200,
        ip_address: '192.168.1.100',
        device_type: 'desktop',
        browser: 'Chrome',
        region: 'California',
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-15T10:30:00.000Z'
      });
    });

    it('should handle null logout_time correctly', async () => {
      // Arrange
      const dataWithNullLogout = { ...mockUserLoginData, logout_time: null };
      const prismaResultWithNullLogout = { ...mockPrismaResult, logout_time: null };
      
      jest.spyOn(prismaService.userLogin, 'create').mockResolvedValue(prismaResultWithNullLogout);

      // Act
      const result = await repository.create(dataWithNullLogout);

      // Assert
      expect(result.logout_time).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all user login records in DTO format', async () => {
      // Arrange
      const mockPrismaResults = [mockPrismaResult, { ...mockPrismaResult, id: 2, user_id: 456 }];
      jest.spyOn(prismaService.userLogin, 'findMany').mockResolvedValue(mockPrismaResults);

            // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('login_time', '2024-01-15T10:30:00.000Z');
      expect(result[1]).toHaveProperty('user_id', 456);
    });
  });

  describe('getDeviceTypeCounts', () => {
    it('should return device type counts', async () => {
      // Arrange
      const mockAggregationResult = [
        { device_type: 'desktop', _count: { device_type: 15 } },
        { device_type: 'mobile', _count: { device_type: 8 } },
        { device_type: 'tablet', _count: { device_type: 2 } }
      ];

      // Mock the groupBy method with any type to avoid complex Prisma type issues
      jest.spyOn(prismaService.userLogin, 'groupBy').mockResolvedValue(mockAggregationResult as any);

      // Act
      const result = await repository.getDeviceTypeCounts();

      // Assert
      expect(result).toEqual([
        { device_type: 'desktop', count: 15 },
        { device_type: 'mobile', count: 8 },
        { device_type: 'tablet', count: 2 }
      ]);
    });

    it('should handle empty aggregation results', async () => {
      // Arrange
      jest.spyOn(prismaService.userLogin, 'groupBy').mockResolvedValue([] as any);

      // Act
      const result = await repository.getDeviceTypeCounts();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findByDateRange', () => {
    it('should return user logins within specified date range', async () => {
      // Arrange
      const startDate = new Date('2024-01-15T00:00:00.000Z');
      const endDate = new Date('2024-01-15T23:59:59.999Z');
      const mockResults = [mockPrismaResult];

      jest.spyOn(prismaService.userLogin, 'findMany').mockResolvedValue(mockResults);

      // Act
      const result = await repository.findByDateRange(startDate, endDate);

      // Assert
      expect(prismaService.userLogin.findMany).toHaveBeenCalledWith({
        where: {
          login_time: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe(123);
    });
  });
});
