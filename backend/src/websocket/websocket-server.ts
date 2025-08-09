import { WebSocketServer as WSServer } from 'ws';
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketClient } from './interfaces/websocket.interfaces';
import { ClientManager } from './services/client-manager.service';
import { MessageHandler } from './services/message-handler.service';
import { StatsProvider } from './services/stats-provider.service';

@Injectable()
export class WebSocketServer {
  private wss!: WSServer;
  private readonly logger = new Logger(WebSocketServer.name);

  constructor(
    private readonly clientManager: ClientManager,
    private readonly messageHandler: MessageHandler,
    private readonly statsProvider: StatsProvider
  ) {}

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
    const clientId = this.clientManager.generateClientId();
    ws.id = clientId;
    ws.isAlive = true;

    this.clientManager.addClient(ws);

    try {
      const welcomeMessage = this.messageHandler.createWelcomeMessage(clientId);
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
        
        this.messageHandler.handleMessage(ws, message);
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
      this.clientManager.removeClient(clientId);
    });

    ws.on('error', (error) => {
      this.logger.error(`WebSocket error for ${clientId}:`, error);
      this.clientManager.removeClient(clientId);
    });
  }

  public async broadcastStatsUpdate() {
    if (this.clientManager.getActiveConnectionCount() === 0) {
      return;
    }

    try {
      const statsData = await this.statsProvider.getAggregatedStats();
      const message = {
        type: 'stats_update',
        payload: statsData,
      };

      const messageString = JSON.stringify(message);
      const sentCount = this.clientManager.broadcast(messageString);

      this.logger.log(`Broadcasted stats update to ${sentCount} clients`);
    } catch (error) {
      this.logger.error('Error broadcasting stats update:', error);
    }
  }

  private startHeartbeat() {
    this.clientManager.startHeartbeat();
  }

  public stop() {
    this.clientManager.stopHeartbeat();
    this.clientManager.closeAllConnections();

    if (this.wss) {
      this.wss.close();
    }
    
    this.logger.log('WebSocket server stopped');
  }

  // Public method to get connection count
  public getActiveConnectionCount(): number {
    return this.clientManager.getActiveConnectionCount();
  }

  // Public method to get client IDs
  public getActiveClientIds(): string[] {
    return this.clientManager.getActiveClientIds();
  }
}
