import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { WebsocketClientManager } from '../websocket-client.manager';

describe('WebsocketClientManager', () => {
  let service: WebsocketClientManager;
  let loggerSpy: jest.SpiedFunction<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebsocketClientManager],
    }).compile();

    service = module.get<WebsocketClientManager>(WebsocketClientManager);
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addClient', () => {
    it('should add a client to the clients map', () => {
      const clientId = 'test-client-1';
      const mockClient = { id: clientId, socket: 'mock-socket' };

      service.addClient(clientId, mockClient);

      const clients = service.getAllClients();
      expect(clients.has(clientId)).toBe(true);
      expect(clients.get(clientId)).toBe(mockClient);
    });

    it('should log when a client is added', () => {
      const clientId = 'test-client-1';
      const mockClient = { id: clientId };

      service.addClient(clientId, mockClient);

      expect(loggerSpy).toHaveBeenCalledWith(`Client connected: ${clientId}`);
    });

    it('should overwrite existing client with same id', () => {
      const clientId = 'test-client-1';
      const firstClient = { id: clientId, data: 'first' };
      const secondClient = { id: clientId, data: 'second' };

      service.addClient(clientId, firstClient);
      service.addClient(clientId, secondClient);

      const clients = service.getAllClients();
      expect(clients.get(clientId)).toBe(secondClient);
      expect(clients.get(clientId)).not.toBe(firstClient);
    });
  });

  describe('removeClient', () => {
    it('should remove a client from the clients map', () => {
      const clientId = 'test-client-1';
      const mockClient = { id: clientId };

      // First add the client
      service.addClient(clientId, mockClient);
      expect(service.getAllClients().has(clientId)).toBe(true);

      // Then remove it
      service.removeClient(clientId);
      expect(service.getAllClients().has(clientId)).toBe(false);
    });

    it('should log when a client is removed', () => {
      const clientId = 'test-client-1';
      const mockClient = { id: clientId };

      service.addClient(clientId, mockClient);
      service.removeClient(clientId);

      expect(loggerSpy).toHaveBeenCalledWith(`Client disconnected: ${clientId}`);
    });

    it('should handle removing non-existent client gracefully', () => {
      const clientId = 'non-existent-client';

      expect(() => service.removeClient(clientId)).not.toThrow();
      expect(loggerSpy).toHaveBeenCalledWith(`Client disconnected: ${clientId}`);
    });
  });

  describe('getAllClients', () => {
    it('should return empty map when no clients are added', () => {
      const clients = service.getAllClients();
      
      expect(clients).toBeInstanceOf(Map);
      expect(clients.size).toBe(0);
    });

    it('should return map with all added clients', () => {
      const client1 = { id: 'client-1' };
      const client2 = { id: 'client-2' };
      const client3 = { id: 'client-3' };

      service.addClient('client-1', client1);
      service.addClient('client-2', client2);
      service.addClient('client-3', client3);

      const clients = service.getAllClients();
      expect(clients.size).toBe(3);
      expect(clients.get('client-1')).toBe(client1);
      expect(clients.get('client-2')).toBe(client2);
      expect(clients.get('client-3')).toBe(client3);
    });

    it('should return the actual map reference (not a copy)', () => {
      const client1 = { id: 'client-1' };
      service.addClient('client-1', client1);

      const clients1 = service.getAllClients();
      const clients2 = service.getAllClients();

      expect(clients1).toBe(clients2); // Same reference
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple add and remove operations', () => {
      const clients = [
        { id: 'client-1', data: 'data1' },
        { id: 'client-2', data: 'data2' },
        { id: 'client-3', data: 'data3' },
      ];

      // Add all clients
      clients.forEach((client, index) => {
        service.addClient(`client-${index + 1}`, client);
      });

      expect(service.getAllClients().size).toBe(3);

      // Remove middle client
      service.removeClient('client-2');
      expect(service.getAllClients().size).toBe(2);
      expect(service.getAllClients().has('client-1')).toBe(true);
      expect(service.getAllClients().has('client-2')).toBe(false);
      expect(service.getAllClients().has('client-3')).toBe(true);

      // Add client back
      service.addClient('client-2', clients[1]);
      expect(service.getAllClients().size).toBe(3);
    });

    it('should maintain correct logging for multiple operations', () => {
      // Clear previous mock calls to ensure clean state
      loggerSpy.mockClear();
      
      service.addClient('client-1', { id: 'client-1' });
      service.addClient('client-2', { id: 'client-2' });
      service.removeClient('client-1');

      expect(loggerSpy).toHaveBeenCalledTimes(3);
      expect(loggerSpy).toHaveBeenNthCalledWith(1, 'Client connected: client-1');
      expect(loggerSpy).toHaveBeenNthCalledWith(2, 'Client connected: client-2');
      expect(loggerSpy).toHaveBeenNthCalledWith(3, 'Client disconnected: client-1');
    });
  });
});
