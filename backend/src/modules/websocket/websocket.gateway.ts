import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebsocketService } from './websocket.service';
import { Injectable, Logger } from '@nestjs/common';
import { MyConfiguration } from '../../MyConfiguration';
import { ClientMessage } from './interfaces/websocket.interface';

@WebSocketGateway(MyConfiguration.WS_PORT())
@Injectable()
export class WebsocketGateway {
  constructor(private readonly websocketService: WebsocketService) {}
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  server!: Server;

  afterInit() {
    this.logger.log('WebSocket server initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: ClientMessage): Promise<void> {
    this.logger.log(`Message received from ${client.id}: ${JSON.stringify(data)}`);
    if (!data || !data.type) {
      client.emit('message', 'Invalid message format');
      return;
    }
    switch (data.type) {
      case 'ping':
        client.emit('message', { type: 'pong' });
        break;
      case 'request_initial_data':
        const initialDataResponse = await this.websocketService.requestInitialData();
        client.emit('message', initialDataResponse);
        break;
      default:
        client.emit('message', `Unknown message type: ${data.type}`);
    }
  }
}
