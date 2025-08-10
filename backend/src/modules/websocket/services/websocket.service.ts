import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule/dist/decorators/cron.decorator';
import { Server, Socket } from 'socket.io';

import { MyConfiguration } from '../../../MyConfiguration';
import { ClientMessage } from '../websocket.interface';
import { ServerResponse } from '../websocket.interface';
import { WebsocketClientManager } from './websocket-client.manager';
import { WebsocketMessageHandler } from './websocket-message.handler';

@Injectable()
export class WebsocketService {
  constructor(
    private readonly messageHandler: WebsocketMessageHandler,
    private readonly clientManager: WebsocketClientManager,
  ) {}
  private server!: Server;
  private readonly logger = new Logger(WebsocketService.name);

  setServer(server: Server) {
    this.server = server;
  }

  handleConnection(client: Socket): void {
    this.clientManager.addClient(client.id, client);
  }

  handleDisconnect(client: Socket): void {
    this.clientManager.removeClient(client.id);
  }

  async handleMessage(client: Socket, message: ClientMessage): Promise<void> {
    const result = await this.messageHandler.handle(message);
    this.sendResponseToClient(client.id, result);
  }

  @Cron(`*/${MyConfiguration.STATS_BROADCAST_INTERVAL_SECONDS()} * * * * *`)
  async fetchUpdatedData(): Promise<void> {
    this.logger.log('Broadcast fetched data');
    const stats = await this.messageHandler.handleDataRequest();
    this.broadcastToAllClients({
      type: 'stats_update',
      payload: stats,
    });
  }

  sendResponseToClient(clientId: string, response: ServerResponse): void {
    if (this.server) {
      this.server.to(clientId).emit('message', response);
      this.logger.log(`Response sent to client ${clientId}: ${response}`);
    } else {
      this.logger.error('WebSocket server is not initialized');
    }
  }

  broadcastToAllClients(response: ServerResponse): void {
    if (this.server) {
      this.server.emit('message', response);
    } else {
      this.logger.error('WebSocket server is not initialized');
    }
  }
}
