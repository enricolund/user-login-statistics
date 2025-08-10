import { Injectable, Logger } from '@nestjs/common';
import { AVAILABLE_MESSAGE_TYPES, ClientMessage, RequestMessageType } from './websocket.interface';
import { ServerResponse } from './websocket.interface';
import { Cron } from '@nestjs/schedule/dist/decorators/cron.decorator';
import { CronExpression } from '@nestjs/schedule';
import { Server, Socket } from 'socket.io';
import { StatsService } from '../stats/stats.service';
import { Stats } from '../stats/stats.interface';
import { CacheService } from '../../services/stats-cache.service';

@Injectable()
export class WebsocketService {
    constructor(
        private readonly cacheManager: CacheService,
        private readonly statsService: StatsService,
    ) {}
    private server: Server;
    private readonly clients: Map<string, Socket> = new Map();
    private readonly logger = new Logger(WebsocketService.name);
    private readonly handlers: Record<RequestMessageType, () => any> = {
        ping: () => this.handlePing(),
        request_initial_data: () => this.requestInitialData(),
    };

    setServer(server: Server) {
        this.server = server;
    }

    async handleMessage(client: Socket, message: ClientMessage): Promise<void> {
        const handler = this.handlers[message.type];
        if (handler) {
            this.sendResponseToClient(client.id, await handler());
        } else {
            this.sendResponseToClient(
                client.id,
                { type: "error", message: `Unknown message type: ${message.type}. Available types: ${AVAILABLE_MESSAGE_TYPES}` }
            );
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

    async requestInitialData(): Promise<ServerResponse> {
        const cachedData = await this.cacheManager.get<Stats>('statsData');
        if (cachedData) {
            this.logger.log('Returning cached initial data');
            return {
                type: 'stats_update',
                payload: cachedData,
            };
        }

        const stats = await this.statsService.getAllStats();
        await this.cacheManager.set(
            'statsData',
            { 
                type: 'stats_update',
                payload: stats,
            }
        );
        return {
            type: 'stats_update',
            payload: stats,
        };
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async fetchUpdatedData(): Promise<void> {
        this.logger.log('Fetching updated data every 30 seconds');
        const stats = await this.statsService.getAllStats();
        this.broadcastToAllClients({
            type: 'stats_update',
            payload: stats,
        });
        await this.cacheManager.set('statsData', stats);
    }

    sendResponseToClient(clientId: string, response: ServerResponse): void {
        if (this.server) {
            this.server.to(clientId).emit('message', response);
            this.logger.log(`Response sent to client ${clientId}: ${JSON.stringify(response)}`);
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
