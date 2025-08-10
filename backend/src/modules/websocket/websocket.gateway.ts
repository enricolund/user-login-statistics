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
    
    // Handle unknown events at the server level
    this.server.on('connection', (socket) => {
        socket.onAny((eventName, ..._args) => {
            // Filter out Socket.IO internal events and known events
            const allowedEventName = [MyConfiguration.WS_EVENT_NAME()];

            if (!allowedEventName.includes(eventName)) {
                this.logger.warn(`Unknown event received: ${eventName} from client ${socket.id}`);
                socket.disconnect(true);
            }
        });
    });
}

  handleConnection(client: Socket) {
    this.websocketService.handleConnection(client);
  }

  handleDisconnect(client: Socket) {
    this.websocketService.handleDisconnect(client);
  }

  @SubscribeMessage(MyConfiguration.WS_EVENT_NAME())
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: ClientMessage): Promise<void> {
    this.websocketService.handleMessage(client, data);
  }
}
