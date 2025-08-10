import { Test, TestingModule } from '@nestjs/testing';

import { Stats } from '../../../stats/stats.interface';
import { StatsService } from '../../../stats/stats.service';
import { ClientMessage } from '../../websocket.interface';
import { WebsocketMessageHandler } from '../websocket-message.handler';

describe('WebsocketMessageHandler', () => {
  let service: WebsocketMessageHandler;
  let mockStatsService: jest.Mocked<StatsService>;

  beforeEach(async () => {
    // Create mock StatsService
    mockStatsService = {
      getAggregatedStats: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [WebsocketMessageHandler, { provide: StatsService, useValue: mockStatsService }],
    }).compile();

    service = module.get<WebsocketMessageHandler>(WebsocketMessageHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handle', () => {
    it('should handle ping message', async () => {
      const message: ClientMessage = { type: 'ping' };

      const result = await service.handle(message);

      expect(result).toEqual({
        type: 'pong',
      });
    });

    it('should handle request_initial_data message', async () => {
      const mockStats: Stats = {
        deviceStats: [{ device_type: 'mobile', count: 10 }],
        regionDeviceStats: [{ region: 'US', count: 20 }],
        sessionStats: {
          totalSessions: 200,
          averageDuration: 150,
          minDuration: 60,
          maxDuration: 300,
          medianDuration: 120,
        },
      };

      mockStatsService.getAggregatedStats.mockResolvedValue(mockStats);

      const message: ClientMessage = { type: 'request_initial_data' };

      const result = await service.handle(message);

      expect(mockStatsService.getAggregatedStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });

    it('should handle unknown message type', async () => {
      const message = { type: 'unknown_type' } as any;

      const result = await service.handle(message);

      expect(result).toEqual({
        type: 'error',
        message: expect.stringContaining('Unknown message type: unknown_type'),
      });
    });
  });

  describe('handlePing', () => {
    it('should return pong response', () => {
      const result = service.handlePing();

      expect(result).toEqual({
        type: 'pong',
      });
    });
  });

  describe('handleDataRequest', () => {
    it('should return stats from service', async () => {
      const mockStats: Stats = {
        deviceStats: [{ device_type: 'desktop', count: 50 }],
        regionDeviceStats: [{ region: 'EU', count: 100 }],
        sessionStats: {
          totalSessions: 100,
          averageDuration: 120,
          minDuration: 30,
          maxDuration: 200,
          medianDuration: 100,
        },
      };

      mockStatsService.getAggregatedStats.mockResolvedValue(mockStats);

      const result = await service.handleDataRequest();

      expect(mockStatsService.getAggregatedStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });

    it('should handle service error gracefully', async () => {
      mockStatsService.getAggregatedStats.mockRejectedValue(new Error('Service unavailable'));

      await expect(service.handleDataRequest()).rejects.toThrow('Service unavailable');

      expect(mockStatsService.getAggregatedStats).toHaveBeenCalled();
    });
  });

  describe('error scenarios', () => {
    it('should handle stats service error', async () => {
      mockStatsService.getAggregatedStats.mockRejectedValue(new Error('Database error'));

      const message: ClientMessage = { type: 'request_initial_data' };

      await expect(service.handle(message)).rejects.toThrow('Database error');
    });
  });
});
