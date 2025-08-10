import { Stats } from '../stats/stats.interface';

export const AVAILABLE_MESSAGE_TYPES = ['ping', 'request_initial_data'] as const;

export type RequestMessageType = (typeof AVAILABLE_MESSAGE_TYPES)[number];

export interface ClientMessage {
  type: RequestMessageType;
}
export type ResponseMessageType = 'pong' | 'stats_update' | 'error';

export interface ServerResponse {
  type: ResponseMessageType;
  payload?: Stats;
  message?: string;
}
