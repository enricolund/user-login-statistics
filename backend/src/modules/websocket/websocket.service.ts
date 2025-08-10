import { Injectable, Logger } from '@nestjs/common';
import { AVAILABLE_MESSAGE_TYPES, ClientMessage, RequestMessageType } from './websocket.interface';
import { ServerResponse } from './websocket.interface';
import { Cron } from '@nestjs/schedule/dist/decorators/cron.decorator';
import { Server, Socket } from 'socket.io';
import { Stats } from '../stats/stats.interface';
import { StatsService } from '../stats/stats.service';
import { MyConfiguration } from '../../MyConfiguration';

@Injectable()
export class WebsocketService {
    constructor(
        private readonly statsService: StatsService,
    ) {}
    private server!: Server;
    private readonly clients: Map<string, Socket> = new Map();
    private readonly logger = new Logger(WebsocketService.name);
    private readonly handlers: Record<RequestMessageType, () => any> = {
        ping: () => this.handlePing(),
        request_initial_data: () => this.requestData(),
    };

    setServer(server: Server) {
        this.server = server;
    }

    async handleMessage(client: Socket, message: ClientMessage): Promise<void> {
        const handler = this.handlers[message.type];
        if (handler) {
            this.sendResponseToClient(client.id, await handler());
        } else {
            this.sendResponseToClient(client.id, {
                type: "error", message: `Unknown message type: ${message.type}. Available types: ${AVAILABLE_MESSAGE_TYPES}`
            });
        }
    }

    handleConnection(client: Socket): void {
        this.clients.set(client.id, client);
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket): void {
        this.clients.delete(client.id);
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    handlePing(): ServerResponse {
        return {
            type: 'pong',
        };
    }

    async requestData(): Promise<Stats | undefined> {
        const result = await this.statsService.getAggregatedStats();
        return result;
    }

    @Cron(`*/${MyConfiguration.STATS_BROADCAST_INTERVAL_SECONDS()} * * * * *`)
    async fetchUpdatedData(): Promise<void> {
        this.logger.log('Broadcast fetched data');
        const stats = await this.requestData();
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
