import { Injectable, Logger } from '@nestjs/common';
import { WebSocketClient, WebSocketMessage, WebSocketResponse } from '../interfaces/websocket.interfaces';
import { StatsProvider } from './stats-provider.service';
import { ClientManager } from './client-manager.service';

@Injectable()
export class MessageHandler {
  private readonly logger = new Logger(MessageHandler.name);

  constructor(
    private readonly statsProvider: StatsProvider,
    private readonly clientManager: ClientManager
  ) {}

  public async handleMessage(ws: WebSocketClient, message: WebSocketMessage): Promise<void> {
    this.logger.log(`Processing '${message.type}' from client ${ws.id}`);
    
    try {
      const response = await this.processMessage(message);
      
      if (response) {
        await this.sendResponse(ws, response);
      }
    } catch (error) {
      this.logger.error(`Error processing message from ${ws.id}:`, error);
      await this.sendErrorResponse(ws, 'Internal server error');
    }
  }

  private async processMessage(message: WebSocketMessage): Promise<WebSocketResponse | null> {
    switch (message.type) {
      case 'ping':
        return this.handlePing();
        
      case 'request_initial_data':
      case 'stats':
      case 'get_stats':
        return await this.handleStatsRequest();
        
      case 'subscribe':
        return this.handleSubscribe();
        
      case 'status':
      case 'info':
        return this.handleStatus();
        
      default:
        return this.handleUnknownMessage(message.type);
    }
  }

  private handlePing(): WebSocketResponse {
    return { 
      type: 'pong', 
      timestamp: new Date().toISOString() 
    };
  }

  private async handleStatsRequest(): Promise<WebSocketResponse> {
    return await this.statsProvider.getStatsResponse();
  }

  private handleSubscribe(): WebSocketResponse {
    return { 
      type: 'subscribed', 
      message: 'Subscribed to real-time updates',
      timestamp: new Date().toISOString()
    };
  }

  private handleStatus(): WebSocketResponse {
    return {
      type: 'status',
      data: {
        activeClients: this.clientManager.getActiveConnectionCount(),
        serverTime: new Date().toISOString()
      }
    };
  }

  private handleUnknownMessage(messageType: string): WebSocketResponse {
    return { 
      type: 'error', 
      error: `Unknown message type: ${messageType}`,
      availableTypes: ['ping', 'request_initial_data', 'stats', 'subscribe', 'status'],
      timestamp: new Date().toISOString()
    };
  }

  private async sendResponse(ws: WebSocketClient, response: WebSocketResponse): Promise<void> {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify(response));
      this.logger.log(`Sent ${response.type} to client ${ws.id}`);
    }
  }

  private async sendErrorResponse(ws: WebSocketClient, error: string): Promise<void> {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify({
        type: 'error',
        error,
        timestamp: new Date().toISOString()
      }));
    }
  }

  public createWelcomeMessage(clientId: string): any {
    return {
      type: 'welcome',
      message: 'Connected to User Login Statistics WebSocket',
      clientId: clientId,
      timestamp: new Date().toISOString()
    };
  }
}
