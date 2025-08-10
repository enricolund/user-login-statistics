import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WebsocketGateway } from '../websocket.gateway';
import { WebsocketService } from '../services/websocket.service';
import { ClientMessage } from '../websocket.interface';

// Mock MyConfiguration
jest.mock('../../../MyConfiguration', () => ({
  MyConfiguration: {
    WS_PORT: jest.fn(() => 3001),
    WS_EVENT_NAME: jest.fn(() => 'message'),
    STATS_BROADCAST_INTERVAL_SECONDS: jest.fn(() => 5),
  },
}));

describe('WebsocketGateway', () => {
  let gateway: WebsocketGateway;
  let mockWebsocketService: jest.Mocked<WebsocketService>;
  let mockServer: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<Socket>;
  let loggerSpy: jest.SpiedFunction<any>;

  beforeEach(async () => {
    // Create mocks
    mockWebsocketService = {
      setServer: jest.fn(),
      handleConnection: jest.fn(),
      handleDisconnect: jest.fn(),
      handleMessage: jest.fn(),
    } as any;

    mockServer = {
      on: jest.fn(),
    } as any;

    mockSocket = {
      id: 'test-socket-123',
      onAny: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsocketGateway,
        { provide: WebsocketService, useValue: mockWebsocketService },
      ],
    }).compile();

    gateway = module.get<WebsocketGateway>(WebsocketGateway);
    
    // Set the server property
    gateway.server = mockServer;
    
    // Mock logger
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('afterInit', () => {
    it('should initialize WebSocket server and set up event handlers', () => {
      gateway.afterInit();

      expect(loggerSpy).toHaveBeenCalledWith('WebSocket server initialized');
      expect(mockWebsocketService.setServer).toHaveBeenCalledWith(mockServer);
      expect(mockServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should set up unknown event handling on connection', () => {
      const mockConnectionCallback = jest.fn();
      mockServer.on.mockImplementation((event, callback) => {
        if (event === 'connection') {
          mockConnectionCallback.mockImplementation(callback);
        }
        return mockServer;
      });

      gateway.afterInit();

      // Verify that the connection handler was registered
      expect(mockServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
      
      // Simulate a connection
      mockConnectionCallback(mockSocket);
      expect(mockSocket.onAny).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('handleConnection', () => {
    it('should delegate to websocket service', () => {
      gateway.handleConnection(mockSocket);

      expect(mockWebsocketService.handleConnection).toHaveBeenCalledWith(mockSocket);
    });
  });

  describe('handleDisconnect', () => {
    it('should delegate to websocket service', () => {
      gateway.handleDisconnect(mockSocket);

      expect(mockWebsocketService.handleDisconnect).toHaveBeenCalledWith(mockSocket);
    });
  });

  describe('handleMessage', () => {
    it('should delegate message handling to websocket service', async () => {
      const message: ClientMessage = { type: 'ping' };

      await gateway.handleMessage(mockSocket, message);

      expect(mockWebsocketService.handleMessage).toHaveBeenCalledWith(mockSocket, message);
    });

    it('should handle different message types', async () => {
      const messages: ClientMessage[] = [
        { type: 'ping' },
        { type: 'request_initial_data' },
      ];

      for (const message of messages) {
        await gateway.handleMessage(mockSocket, message);
        expect(mockWebsocketService.handleMessage).toHaveBeenCalledWith(mockSocket, message);
      }

      expect(mockWebsocketService.handleMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('unknown event handling', () => {
    let connectionHandler: (socket: Socket) => void;
    let eventHandler: (eventName: string, ...args: any[]) => void;

    beforeEach(() => {
      // Capture the connection handler
      mockServer.on.mockImplementation((event, handler) => {
        if (event === 'connection') {
          connectionHandler = handler;
        }
        return mockServer;
      });

      // Capture the event handler
      mockSocket.onAny.mockImplementation((handler) => {
        eventHandler = handler;
        return mockSocket;
      });

      gateway.afterInit();
      connectionHandler(mockSocket);
    });

    it('should allow known events', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      
      // Simulate known event
      eventHandler('message');

      expect(warnSpy).not.toHaveBeenCalled();
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect client for unknown events', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      
      // Simulate unknown event
      eventHandler('unknown_event');

      expect(warnSpy).toHaveBeenCalledWith('Unknown event received: unknown_event from client test-socket-123');
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it('should handle multiple unknown events', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      
      // Simulate multiple unknown events
      eventHandler('bad_event_1');
      eventHandler('bad_event_2');

      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenNthCalledWith(1, 'Unknown event received: bad_event_1 from client test-socket-123');
      expect(warnSpy).toHaveBeenNthCalledWith(2, 'Unknown event received: bad_event_2 from client test-socket-123');
      expect(mockSocket.disconnect).toHaveBeenCalledTimes(2);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete client lifecycle', async () => {
      // Initialize gateway
      gateway.afterInit();

      // Connect client
      gateway.handleConnection(mockSocket);
      expect(mockWebsocketService.handleConnection).toHaveBeenCalledWith(mockSocket);

      // Handle message
      const message: ClientMessage = { type: 'ping' };
      await gateway.handleMessage(mockSocket, message);
      expect(mockWebsocketService.handleMessage).toHaveBeenCalledWith(mockSocket, message);

      // Disconnect client
      gateway.handleDisconnect(mockSocket);
      expect(mockWebsocketService.handleDisconnect).toHaveBeenCalledWith(mockSocket);
    });

    it('should properly configure server after initialization', () => {
      gateway.afterInit();

      expect(mockWebsocketService.setServer).toHaveBeenCalledWith(mockServer);
      expect(mockServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
      expect(loggerSpy).toHaveBeenCalledWith('WebSocket server initialized');
    });
  });

  describe('error scenarios', () => {
    it('should properly propagate websocket service errors', async () => {
      const error = new Error('Service error');
      mockWebsocketService.handleMessage.mockRejectedValue(error);

      const message: ClientMessage = { type: 'ping' };

      // Now that the gateway properly awaits the service call, it should propagate errors
      await expect(gateway.handleMessage(mockSocket, message)).rejects.toThrow('Service error');
      expect(mockWebsocketService.handleMessage).toHaveBeenCalledWith(mockSocket, message);
    });

    it('should handle service errors gracefully without crashing', async () => {
      const error = new Error('Database connection failed');
      mockWebsocketService.handleMessage.mockRejectedValue(error);

      const message: ClientMessage = { type: 'request_initial_data' };

      // The error should be propagated, not swallowed
      await expect(gateway.handleMessage(mockSocket, message)).rejects.toThrow('Database connection failed');
      expect(mockWebsocketService.handleMessage).toHaveBeenCalledWith(mockSocket, message);
    });
  });
});
