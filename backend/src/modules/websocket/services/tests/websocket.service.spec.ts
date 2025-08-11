import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';

import { Stats } from '../../../stats/stats.interface';
import { ClientMessage, ServerResponse } from '../../websocket.interface';
import { WebsocketClientManager } from '../websocket-client.manager';
import { WebsocketMessageHandler } from '../websocket-message.handler';
import { WebsocketService } from '../websocket.service';

describe('WebsocketService', () => {
  let service: WebsocketService;
  let mockMessageHandler: jest.Mocked<WebsocketMessageHandler>;
  let mockClientManager: jest.Mocked<WebsocketClientManager>;
  let mockServer: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<Socket>;
  let loggerSpy: jest.SpiedFunction<any>;

  beforeEach(async () => {
    // Create mocks
    mockMessageHandler = {
      handle: jest.fn(),
      handleDataRequest: jest.fn(),
    } as any;

    mockClientManager = {
      addClient: jest.fn(),
      removeClient: jest.fn(),
    } as any;

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    mockSocket = {
      id: 'test-socket-123',
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsocketService,
        { provide: WebsocketMessageHandler, useValue: mockMessageHandler },
        { provide: WebsocketClientManager, useValue: mockClientManager },
      ],
    }).compile();

    service = module.get<WebsocketService>(WebsocketService);

    // Mock logger
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setServer', () => {
    it('should set the server instance', () => {
      service.setServer(mockServer);

      // We can't directly access the private server property,
      // but we can test it indirectly through other methods
      expect(() => service.setServer(mockServer)).not.toThrow();
    });
  });

  describe('handleConnection', () => {
    it('should add client through client manager', () => {
      service.handleConnection(mockSocket);

      expect(mockClientManager.addClient).toHaveBeenCalledWith('test-socket-123', mockSocket);
    });
  });

  describe('handleDisconnect', () => {
    it('should remove client through client manager', () => {
      service.handleDisconnect(mockSocket);

      expect(mockClientManager.removeClient).toHaveBeenCalledWith('test-socket-123');
    });
  });

  describe('handleMessage', () => {
    it('should process message and send response to client', async () => {
      const message: ClientMessage = { type: 'ping' };
      const response: ServerResponse = { type: 'pong' };

      mockMessageHandler.handle.mockResolvedValue(response);
      service.setServer(mockServer);

      await service.handleMessage(mockSocket, message);

      expect(mockMessageHandler.handle).toHaveBeenCalledWith(message);
      expect(mockServer.to).toHaveBeenCalledWith('test-socket-123');
      expect(mockServer.emit).toHaveBeenCalledWith('message', response);
    });

    it('should handle message handler errors', async () => {
      const message: ClientMessage = { type: 'ping' };
      const error = new Error('Handler error');

      mockMessageHandler.handle.mockRejectedValue(error);
      service.setServer(mockServer);

      await expect(service.handleMessage(mockSocket, message)).rejects.toThrow('Handler error');
      expect(mockMessageHandler.handle).toHaveBeenCalledWith(message);
    });
  });

  describe('sendResponseToClient', () => {
    it('should send response to specific client when server is set', () => {
      const response: ServerResponse = { type: 'pong' };
      service.setServer(mockServer);

      service.sendResponseToClient('test-client-123', response);

      expect(mockServer.to).toHaveBeenCalledWith('test-client-123');
      expect(mockServer.emit).toHaveBeenCalledWith('message', response);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Response sent to client test-client-123'),
      );
    });

    it('should log error when server is not initialized', () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const response: ServerResponse = { type: 'pong' };

      service.sendResponseToClient('test-client-123', response);

      expect(errorSpy).toHaveBeenCalledWith('WebSocket server is not initialized');
      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  describe('broadcastToAllClients', () => {
    it('should broadcast message to all clients when server is set', () => {
      const response: ServerResponse = {
        type: 'stats_update',
        payload: {
          deviceStats: [],
          regionDeviceStats: [],
          sessionStats: {
            totalSessions: 0,
            averageDuration: 0,
            minDuration: 0,
            maxDuration: 0,
            medianDuration: 0,
          },
        } as Stats,
      };
      service.setServer(mockServer);

      service.broadcastToAllClients(response);

      expect(mockServer.emit).toHaveBeenCalledWith('message', response);
    });

    it('should log error when server is not initialized', () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const response: ServerResponse = { type: 'stats_update' };

      service.broadcastToAllClients(response);

      expect(errorSpy).toHaveBeenCalledWith('WebSocket server is not initialized');
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  describe('fetchUpdatedData', () => {
    it('should fetch data and broadcast to all clients', async () => {
      const mockStats: Stats = {
        deviceStats: [{ device_type: 'mobile', count: 10 }],
        regionDeviceStats: [{ region: 'US', count: 20 }],
        sessionStats: {
          totalSessions: 100,
          averageDuration: 150,
          minDuration: 60,
          maxDuration: 300,
          medianDuration: 120,
        },
      };
      const mockResponse: ServerResponse = {
        type: 'stats_update',
        payload: mockStats,
      };
      mockMessageHandler.handleDataRequest.mockResolvedValue(mockResponse);
      service.setServer(mockServer);

      await service.fetchUpdatedData();

      expect(loggerSpy).toHaveBeenCalledWith('Broadcast fetched data');
      expect(mockMessageHandler.handleDataRequest).toHaveBeenCalled();
      expect(mockServer.emit).toHaveBeenCalledWith('message', mockResponse);
    });

    it('should handle errors when fetching data', async () => {
      const error = new Error('Data fetch error');
      mockMessageHandler.handleDataRequest.mockRejectedValue(error);
      service.setServer(mockServer);

      await expect(service.fetchUpdatedData()).rejects.toThrow('Data fetch error');
      expect(mockMessageHandler.handleDataRequest).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete client lifecycle', async () => {
      // Setup
      service.setServer(mockServer);
      const message: ClientMessage = { type: 'ping' };
      const response: ServerResponse = { type: 'pong' };
      mockMessageHandler.handle.mockResolvedValue(response);

      // Connect client
      service.handleConnection(mockSocket);
      expect(mockClientManager.addClient).toHaveBeenCalledWith('test-socket-123', mockSocket);

      // Handle message
      await service.handleMessage(mockSocket, message);
      expect(mockMessageHandler.handle).toHaveBeenCalledWith(message);
      expect(mockServer.to).toHaveBeenCalledWith('test-socket-123');

      // Disconnect client
      service.handleDisconnect(mockSocket);
      expect(mockClientManager.removeClient).toHaveBeenCalledWith('test-socket-123');
    });

    it('should work without server for connection management', () => {
      // Should not throw errors even without server
      expect(() => service.handleConnection(mockSocket)).not.toThrow();
      expect(() => service.handleDisconnect(mockSocket)).not.toThrow();

      expect(mockClientManager.addClient).toHaveBeenCalled();
      expect(mockClientManager.removeClient).toHaveBeenCalled();
    });
  });
});
