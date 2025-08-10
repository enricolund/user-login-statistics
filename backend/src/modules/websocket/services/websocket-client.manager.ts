import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WebsocketClientManager {
  private readonly logger = new Logger(WebsocketClientManager.name);
  private clients: Map<string, any> = new Map();

  addClient(clientId: string, client: any): void {
    this.clients.set(clientId, client);
    this.logger.log(`Client connected: ${clientId}`);
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    this.logger.log(`Client disconnected: ${clientId}`);
  }

  getAllClients(): Map<string, any> {
    return this.clients;
  }
}
