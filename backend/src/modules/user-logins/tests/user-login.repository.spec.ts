import { PrismaService } from '../../../services/prisma.service';
import { UserLoginRepository } from '../user-login.repository';

describe('UserLoginRepository', () => {
  let repo: UserLoginRepository;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      userLogin: {
        create: jest.fn(),
        createMany: jest.fn(),
        groupBy: jest.fn(),
      },
      $queryRaw: jest.fn(),
    } as any;
    repo = new UserLoginRepository(prisma);
  });

  it('should create a user login', async () => {
    (prisma.userLogin.create as jest.Mock).mockResolvedValue({ id: 1 });
    const result = await repo.createUserLogin({ userId: 1 } as any);
    expect(prisma.userLogin.create).toHaveBeenCalledWith({ data: { userId: 1 } });
    expect(result).toEqual({ id: 1 });
  });

  it('should create multiple user logins', async () => {
    (prisma.userLogin.createMany as jest.Mock).mockResolvedValue({ count: 2 });
    const result = await repo.createUserLogins([{ userId: 1 }, { userId: 2 }] as any);
    expect(prisma.userLogin.createMany).toHaveBeenCalledWith({
      data: [{ userId: 1 }, { userId: 2 }],
    });
    expect(result).toEqual({ count: 2 });
  });

  it('should get region stats', async () => {
    (prisma.userLogin.groupBy as jest.Mock).mockResolvedValue([
      { region: 'EU', _count: { region: 5 } },
    ]);
    const result = await repo.getRegionStats();
    expect(prisma.userLogin.groupBy).toHaveBeenCalledWith({
      by: ['region'],
      _count: { region: true },
      orderBy: { _count: { region: 'desc' } },
    });
    expect(result).toEqual([{ region: 'EU', count: 5 }]);
  });

  it('should get device type stats', async () => {
    (prisma.userLogin.groupBy as jest.Mock).mockResolvedValue([
      { device_type: 'mobile', _count: { device_type: 3 } },
    ]);
    const result = await repo.getDeviceTypeStats();
    expect(prisma.userLogin.groupBy).toHaveBeenCalledWith({
      by: ['device_type'],
      _count: { device_type: true },
      orderBy: { _count: { device_type: 'desc' } },
    });
    expect(result).toEqual([{ device_type: 'mobile', count: 3 }]);
  });

  it('should get browser stats', async () => {
    (prisma.userLogin.groupBy as jest.Mock).mockResolvedValue([
      { browser: 'Chrome', _count: { browser: 4 } },
    ]);
    const result = await repo.getBrowserStats();
    expect(prisma.userLogin.groupBy).toHaveBeenCalledWith({
      by: ['browser'],
      _count: { browser: true },
      orderBy: { _count: { browser: 'desc' } },
    });
    expect(result).toEqual([{ browser: 'Chrome', count: 4 }]);
  });

  it('should get session stats', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([
      {
        total_sessions: 10,
        avg_duration: 20,
        min_duration: 5,
        max_duration: 30,
        median_duration: 15,
      },
    ]);
    const result = await repo.getSessionStats();
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result).toEqual({
      totalSessions: 10,
      averageDuration: 20,
      minDuration: 5,
      maxDuration: 30,
      medianDuration: 15,
    });
  });

  it('should handle empty session stats result', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
    const result = await repo.getSessionStats();
    expect(result).toEqual({
      totalSessions: 0,
      averageDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      medianDuration: 0,
    });
  });

  it('should handle error in getSessionStats', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('fail'));
    const result = await repo.getSessionStats();
    expect(result).toEqual({
      totalSessions: 0,
      averageDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      medianDuration: 0,
    });
  });
});
