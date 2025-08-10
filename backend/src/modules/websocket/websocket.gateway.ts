import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebsocketService } from './services/websocket.service';
import { Injectable, Logger } from '@nestjs/common';
import { MyConfiguration } from '../../MyConfiguration';
import { ClientMessage } from './websocket.interface';

@WebSocketGateway(MyConfiguration.WS_PORT())
@Injectable()
export class WebsocketGateway {
  constructor(private readonly websocketService: WebsocketService) {}
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  server!: Server;

  afterInit() {
    this.logger.log('WebSocket server initialized');
    this.websocketService.setServer(this.server);
  }

  handleConnection(client: Socket) {
    this.websocketService.handleConnection(client);
  }

  handleDisconnect(client: Socket) {
    this.websocketService.handleDisconnect(client);
  }

  @SubscribeMessage('message')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: ClientMessage): Promise<void> {
    this.websocketService.handleMessage(client, data);
  }
}
