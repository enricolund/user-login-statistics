import { Injectable, Logger } from '@nestjs/common';
import { WebSocket } from 'ws';
import { WebSocketClient, ClientInfo } from '../interfaces/websocket.interfaces';

@Injectable()
export class ClientManager {
  private readonly logger = new Logger(ClientManager.name);
  private clients = new Map<string, WebSocketClient>();
  private heartbeatInterval!: NodeJS.Timeout;

  public addClient(ws: WebSocketClient): void {
    this.clients.set(ws.id, ws);
    this.logger.log(`Client connected: ${ws.id}. Total clients: ${this.clients.size}`);
  }

  public removeClient(clientId: string): void {
    this.clients.delete(clientId);
    this.logger.log(`Client ${clientId} disconnected. Total: ${this.clients.size}`);
  }

  public getClient(clientId: string): WebSocketClient | undefined {
    return this.clients.get(clientId);
  }

  public getAllClients(): Map<string, WebSocketClient> {
    return this.clients;
  }

  public getActiveConnectionCount(): number {
    return this.clients.size;
  }

  public getActiveClientIds(): string[] {
    return Array.from(this.clients.keys());
  }

  public getClientInfo(): ClientInfo[] {
    return Array.from(this.clients.values()).map(client => ({
      id: client.id,
      isAlive: client.isAlive,
      readyState: client.readyState
    }));
  }

  public generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public startHeartbeat(): void {
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

  public stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  public closeAllConnections(): void {
    for (const [, client] of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    }
    this.clients.clear();
  }

  public broadcast(message: string): number {
    let sentCount = 0;

    for (const [clientId, client] of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        sentCount++;
      } else {
        this.clients.delete(clientId);
        this.logger.warn(`Removed disconnected client: ${clientId}`);
      }
    }

    return sentCount;
  }
}
