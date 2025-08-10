import { Injectable } from '@nestjs/common';

import { Stats } from '../../stats/stats.interface';
import { StatsService } from '../../stats/stats.service';
import {
  AVAILABLE_MESSAGE_TYPES,
  ClientMessage,
  RequestMessageType,
  ServerResponse,
} from '../websocket.interface';

@Injectable()
export class WebsocketMessageHandler {
  constructor(private readonly statsService: StatsService) {}

  private readonly handlers: Record<RequestMessageType, () => any> = {
    ping: () => this.handlePing(),
    request_initial_data: () => this.handleDataRequest(),
  };

  async handle(message: ClientMessage): Promise<ServerResponse> {
    const handler = this.handlers[message.type];
    if (handler) {
      return await handler();
    } else {
      return {
        type: 'error',
        message: `Unknown message type: ${message.type}. Available types: ${AVAILABLE_MESSAGE_TYPES}`,
      };
    }
  }

  handlePing(): ServerResponse {
    return {
      type: 'pong',
    };
  }

  async handleDataRequest(): Promise<Stats | undefined> {
    const result = await this.statsService.getAggregatedStats();
    return result;
  }
}
