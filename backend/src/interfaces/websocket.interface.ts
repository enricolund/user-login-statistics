export interface IWebSocketBroadcaster {
  broadcastToAll(message: any): Promise<void>;
  getConnectionCount(): number;
  start(port: number, path: string): void;
  stop(): void;
}
