import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { Injectable, Logger } from '@nestjs/common';
import { UserLoginService } from '../services/user-login.service';

interface WebSocketClient extends WebSocket {
  id: string;
  isAlive: boolean;
}

@Injectable()
export class WebSocketServer {
  private wss!: WSServer;
  private readonly logger = new Logger(WebSocketServer.name);
  private clients = new Map<string, WebSocketClient>();
  private heartbeatInterval!: NodeJS.Timeout;

  constructor(private readonly userLoginService: UserLoginService) {}

  public start(port: number, path: string = '/ws') {
    this.logger.log(`Starting WebSocket server on port ${port} with path ${path}`);
    
    this.wss = new WSServer({
      port,
      path,
      perMessageDeflate: false,
      clientTracking: true,
    });

    this.wss.on('connection', (ws: WebSocketClient) => {
      this.handleConnection(ws);
    });

    this.wss.on('error', (error) => {
      this.logger.error('WebSocket Server Error:', error);
    });

    this.startHeartbeat();
    this.logger.log(`WebSocket server ready on ws://localhost:${port}${path}`);
  }

  private handleConnection(ws: WebSocketClient) {
    const clientId = this.generateClientId();
    ws.id = clientId;
    ws.isAlive = true;

    this.clients.set(clientId, ws);
    this.logger.log(`Client connected: ${clientId}. Total clients: ${this.clients.size}`);

    try {
      const welcomeMessage = {
        type: 'welcome',
        message: 'Connected to User Login Statistics WebSocket',
        clientId: clientId,
        timestamp: new Date().toISOString()
      };
      
      ws.send(JSON.stringify(welcomeMessage));
      this.logger.log(`Welcome sent to client: ${clientId}`);
    } catch (error) {
      this.logger.error(`Error sending welcome to ${clientId}:`, error);
    }

    ws.on('pong', () => {
      this.logger.debug(`Received pong from client: ${clientId}`);
      ws.isAlive = true;
    });

    ws.on('message', (data) => {
      try {
        const messageStr = data.toString('utf8');
        this.logger.log(`Message from ${clientId}: ${messageStr}`);
        
        let message;
        try {
          message = JSON.parse(messageStr);
        } catch (parseError) {
          message = { type: messageStr.trim() };
        }
        
        this.handleMessage(ws, message);
      } catch (error) {
        this.logger.error(`Error handling message from ${clientId}:`, error);
        try {
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Failed to process message'
          }));
        } catch (sendError) {
          this.logger.error(`Failed to send error response to ${clientId}:`, sendError);
        }
      }
    });

    ws.on('close', () => {
      this.clients.delete(clientId);
      this.logger.log(`Client ${clientId} disconnected. Total: ${this.clients.size}`);
    });

    ws.on('error', (error) => {
      this.logger.error(`WebSocket error for ${clientId}:`, error);
      this.clients.delete(clientId);
    });
  }

  private async handleMessage(ws: WebSocketClient, message: any) {
    this.logger.log(`Processing '${message.type}' from client ${ws.id}`);
    
    try {
      let response;
      
      switch (message.type) {
        case 'ping':
          response = { type: 'pong', timestamp: new Date().toISOString() };
          break;
          
        case 'request_initial_data':
        case 'stats':
        case 'get_stats':
          response = {
            type: 'stats_update',
            payload: await this.getAggregatedStats(),
            timestamp: new Date().toISOString()
          };
          break;
          
        case 'subscribe':
          response = { 
            type: 'subscribed', 
            message: 'Subscribed to real-time updates',
            timestamp: new Date().toISOString()
          };
          break;
          
        case 'status':
        case 'info':
          response = {
            type: 'status',
            data: {
              activeClients: this.clients.size,
              serverTime: new Date().toISOString()
            }
          };
          break;
          
        default:
          response = { 
            type: 'error', 
            error: `Unknown message type: ${message.type}`,
            availableTypes: ['ping', 'request_initial_data', 'stats', 'subscribe', 'status'],
            timestamp: new Date().toISOString()
          };
      }
      
      if (response && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(response));
        this.logger.log(`Sent ${response.type} to client ${ws.id}`);
      }
    } catch (error) {
      this.logger.error(`Error processing message from ${ws.id}:`, error);
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Internal server error',
          timestamp: new Date().toISOString()
        }));
      }
    }
  }

  public async broadcastStatsUpdate() {
    if (this.clients.size === 0) {
      return;
    }

    try {
      const statsData = await this.getAggregatedStats();
      const message = {
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
    const [deviceStats, regionStats, browserStats, allLogins] = await Promise.all([
      this.userLoginService.getDeviceTypeStats(),
      this.userLoginService.getRegionStats(), 
      this.userLoginService.getBrowserStats(),
      this.userLoginService.findAll(),
    ]);

    // Calculate basic metrics
    const totalSessions = allLogins.length;
    const totalUsers = new Set(allLogins.map(login => login.user_id)).size;
    
    // Calculate average session duration for sessions that have duration
    const sessionsWithDuration = allLogins.filter(login => login.session_duration_seconds !== null);
    const averageSessionDuration = sessionsWithDuration.length > 0 
      ? sessionsWithDuration.reduce((sum, login) => sum + (login.session_duration_seconds || 0), 0) / sessionsWithDuration.length
      : 0;

    return {
      totalSessions,
      totalUsers,
      averageSessionDuration,
      deviceStats,
      regionStats,
      browserStats,
    };
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      for (const [clientId, client] of this.clients) {
        if (!client.isAlive) {
          this.logger.warn(`Client ${clientId} failed heartbeat check, terminating`);
          client.terminate();
          this.clients.delete(clientId);
          continue;
        }

        client.isAlive = false;
        if (client.readyState === WebSocket.OPEN) {
          client.ping();
        }
      }

      this.logger.debug(`Heartbeat check completed. Active clients: ${this.clients.size}`);
    }, 30000); // Check every 30 seconds
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public stop() {
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

    if (this.wss) {
      this.wss.close();
    }
    
    this.logger.log('WebSocket server stopped');
  }

  // Public method to get connection count
  public getActiveConnectionCount(): number {
    return this.clients.size;
  }

  // Public method to get client IDs
  public getActiveClientIds(): string[] {
    return Array.from(this.clients.keys());
  }
}
