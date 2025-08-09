import { Inject, Injectable, Logger } from '@nestjs/common';
import { AVAILABLE_MESSAGE_TYPES, ClientMessage, RequestMessageType } from './interfaces/websocket.interface';
import { ServerResponse } from './interfaces/websocket.interface';
import { Cron } from '@nestjs/schedule/dist/decorators/cron.decorator';
import { CronExpression } from '@nestjs/schedule';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class WebsocketService {
    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}
    private readonly logger = new Logger(WebsocketService.name);
    private readonly handlers: Record<RequestMessageType, () => any> = {
        ping: () => this.handlePing(),
        request_initial_data: () => this.requestInitialData(),
    };

    handleMessage(message: ClientMessage): ServerResponse | string {
        const handler = this.handlers[message.type];
        if (handler) {
            return handler();
        }
        return `Unknown message type: ${message.type}. Available types: ${AVAILABLE_MESSAGE_TYPES}`;
    }

    handlePing(): ServerResponse {
        return {
            type: 'pong',
        };
    }

    async requestInitialData(): Promise<ServerResponse> {
        // Fetch and return initial data
        // const initialData = await this.fetchInitialData();
        await this.cacheManager.set('initialData', { type: 'stats_update',
            payload: { deviceStats: [], regionDeviceStats: [], sessionStats: [] }, });
        return {
            type: 'stats_update',
            payload: { deviceStats: [], regionDeviceStats: [], sessionStats: [] },
        };
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async fetchUpdatedData(): Promise<void> {
        // Fetch and return updated data
        this.logger.log('Fetching updated data every 10 seconds');
        this.logger.log(await this.cacheManager.get('initialData'));
    }

}
