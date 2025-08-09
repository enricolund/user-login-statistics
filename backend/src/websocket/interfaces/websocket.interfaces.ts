import { WebSocket } from 'ws';

export interface WebSocketClient extends WebSocket {
  id: string;
  isAlive: boolean;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface WebSocketResponse {
  type: string;
  timestamp?: string;
  [key: string]: any;
}

export interface StatsData {
  totalSessions: number;
  totalUsers: number;
  averageSessionDuration: number;
  deviceStats: any[];
  regionStats: any[];
  browserStats: any[];
}

export interface ClientInfo {
  id: string;
  isAlive: boolean;
  readyState: number;
}
