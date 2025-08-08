import { WsAdapter } from '@nestjs/platform-ws';
import { Server } from 'ws';

export class CustomWsAdapter extends WsAdapter {
  create(port: number, options?: any): Server {
    // Create WebSocket server with compression disabled
    const server = new Server({
      port,
      perMessageDeflate: false, // Disable compression to avoid RSV1 issues
      ...options,
    });

    return server;
  }

  createIOServer(port: number, options?: any): any {
    // For path-based routing, create with path option
    const server = new Server({
      port,
      path: options?.path || '/ws',
      perMessageDeflate: false, // Disable compression
      ...options,
    });

    return server;
  }
}
