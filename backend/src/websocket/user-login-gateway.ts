import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'ws';
import * as WebSocket from 'ws';
import { UserLoginService } from '../services/user-login.service';

interface WebSocketClient extends WebSocket {
  id: string;
  isAlive: boolean;
}

interface StatsUpdateMessage {
  type: 'stats_update';
  payload: {
    deviceStats: { device_type: string; count: number }[];
    regionStats: { region: string; count: number }[];
    browserStats: { browser: string; count: number }[];
    sessionStats: {
      totalSessions: number;
      averageDuration: number;
      minDuration: number;
      maxDuration: number;
      medianDuration: number;
    };
    loginTrends: { date: string; loginCount: number }[];
    peakHours: { hour: number; loginCount: number }[];
  };
}

@WebSocketGateway({
  path: '/ws',
  cors: {
    origin: '*',
  },
  perMessageDeflate: false, // Disable compression to avoid RSV1 issues
})
export class UserLoginGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(UserLoginGateway.name);
  private clients = new Map<string, WebSocketClient>();
  private heartbeatInterval!: NodeJS.Timeout;

  constructor(private readonly userLoginService: UserLoginService) {}

  afterInit() {
    this.logger.log('WebSocket gateway initialized');
    this.startHeartbeat();
  }

  handleConnection(client: WebSocketClient) {
    const clientId = this.generateClientId();
    client.id = clientId;
    client.isAlive = true;

    this.clients.set(clientId, client);
    this.logger.log(`Client connected: ${clientId}. Total clients: ${this.clients.size}`);

    // Set up pong handler for heartbeat
    client.on('pong', () => {
      client.isAlive = true;
    });

    // Handle raw messages with proper error handling
    client.on('message', (data: Buffer) => {
      try {
        const messageStr = data.toString();
        this.logger.debug(`Received message from ${clientId}: ${messageStr}`);
        
        const message = JSON.parse(messageStr);
        this.handleMessage(client, message);
      } catch (error) {
        this.logger.error(`Invalid message from client ${clientId}:`, error);
        // Don't disconnect on parse errors, just log them
      }
    });

    // Handle client errors
    client.on('error', (error) => {
      this.logger.error(`WebSocket error for client ${clientId}:`, error);
      this.cleanupClient(clientId);
    });

    // Handle client close
    client.on('close', () => {
      this.logger.log(`Client ${clientId} connection closed`);
      this.cleanupClient(clientId);
    });
  }

  handleDisconnect(client: WebSocketClient) {
    if (client.id) {
      this.cleanupClient(client.id);
    }
  }

  private cleanupClient(clientId: string) {
    if (this.clients.has(clientId)) {
      this.clients.delete(clientId);
      this.logger.log(`Client disconnected: ${clientId}. Total clients: ${this.clients.size}`);
    }
  }

  private async handleMessage(client: WebSocketClient, message: any) {
    switch (message.type) {
      case 'request_initial_data':
        await this.sendInitialData(client);
        break;
      case 'ping':
        this.sendPong(client);
        break;
      default:
        this.logger.warn(`Unknown message type from client ${client.id}:`, message);
    }
  }

  private async sendInitialData(client: WebSocketClient) {
    try {
      const statsData = await this.getAggregatedStats();
      const response: StatsUpdateMessage = {
        type: 'stats_update',
        payload: statsData,
      };

      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(response));
        this.logger.log(`Sent initial data to client: ${client.id}`);
      }
    } catch (error) {
      this.logger.error(`Error sending initial data to client ${client.id}:`, error);
    }
  }

  private sendPong(client: WebSocketClient) {
    try {
      const pongMessage = { type: 'pong' };
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(pongMessage));
        this.logger.debug(`Sent pong to client: ${client.id}`);
      }
    } catch (error) {
      this.logger.error(`Error sending pong to client ${client.id}:`, error);
    }
  }

  async broadcastStatsUpdate() {
    if (this.clients.size === 0) {
      return;
    }

    try {
      const statsData = await this.getAggregatedStats();
      const message: StatsUpdateMessage = {
        type: 'stats_update',
        payload: statsData,
      };

      const messageString = JSON.stringify(message);
      let sentCount = 0;

      for (const [clientId, client] of this.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageString);
          sentCount++;
        } else {
          // Clean up disconnected clients
          this.clients.delete(clientId);
          this.logger.warn(`Removed disconnected client: ${clientId}`);
        }
      }

      this.logger.log(`Broadcasted stats update to ${sentCount} clients`);
    } catch (error) {
      this.logger.error('Error broadcasting stats update:', error);
    }
  }

  private async getAggregatedStats() {
    const [deviceStats, regionStats, browserStats, sessionStats, loginTrends, peakHours] = 
      await Promise.all([
        this.userLoginService.getDeviceTypeStats(),
        this.userLoginService.getRegionStats(),
        this.userLoginService.getBrowserStats(),
        this.userLoginService.getSessionDurationStats(),
        this.userLoginService.getLoginTrends(30),
        this.userLoginService.getPeakHoursAnalysis(),
      ]);

    return {
      deviceStats,
      regionStats,
      browserStats,
      sessionStats,
      loginTrends,
      peakHours,
    };
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const clientsToRemove: string[] = [];

      for (const [clientId, client] of this.clients) {
        // Check if client is still connected
        if (client.readyState !== WebSocket.OPEN) {
          clientsToRemove.push(clientId);
          continue;
        }

        if (!client.isAlive) {
          // Client didn't respond to ping, terminate connection
          this.logger.warn(`Client ${clientId} failed heartbeat check, terminating`);
          client.terminate();
          clientsToRemove.push(clientId);
          continue;
        }

        // Mark as not alive and send ping
        client.isAlive = false;
        try {
          client.ping();
        } catch (error) {
          this.logger.warn(`Failed to ping client ${clientId}, removing:`, error);
          clientsToRemove.push(clientId);
        }
      }

      // Remove all stale clients
      clientsToRemove.forEach(clientId => {
        this.clients.delete(clientId);
        this.logger.warn(`Removed stale client: ${clientId}`);
      });

      this.logger.debug(`Heartbeat check completed. Active clients: ${this.clients.size}`);
    }, 30000); // Check every 30 seconds
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  onModuleDestroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all client connections
    for (const [, client] of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    }
    this.clients.clear();
    this.logger.log('WebSocket Gateway destroyed');
  }

  // Public method to get connection count
  getActiveConnectionCount(): number {
    // Clean up any disconnected clients before returning count
    this.cleanupDisconnectedClients();
    return this.clients.size;
  }

  // Public method to get client IDs
  getActiveClientIds(): string[] {
    this.cleanupDisconnectedClients();
    return Array.from(this.clients.keys());
  }

  // Force cleanup of disconnected clients
  private cleanupDisconnectedClients() {
    const clientsToRemove: string[] = [];
    
    for (const [clientId, client] of this.clients) {
      if (client.readyState !== WebSocket.OPEN) {
        clientsToRemove.push(clientId);
      }
    }

    clientsToRemove.forEach(clientId => {
      this.clients.delete(clientId);
      this.logger.debug(`Cleaned up disconnected client: ${clientId}`);
    });

    if (clientsToRemove.length > 0) {
      this.logger.log(`Cleaned up ${clientsToRemove.length} disconnected clients. Active clients: ${this.clients.size}`);
    }
  }
}
