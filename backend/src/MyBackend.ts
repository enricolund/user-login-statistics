import { WebSocketAdaptor } from "@nestia/core";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { WebSocketServer } from "./websocket/websocket-server";

import { MyConfiguration } from "./MyConfiguration";
import { MyModule } from "./MyModule";

export class MyBackend {
  private application_?: INestApplication;

  public async open(): Promise<void> {
    this.application_ = await NestFactory.create(MyModule);
    
    this.application_.enableCors({
      origin: MyConfiguration.CORS_ORIGINS().split(','),
      credentials: true,
    });
    
    await WebSocketAdaptor.upgrade(this.application_);

    const wsServer = this.application_.get(WebSocketServer);
    wsServer.start(MyConfiguration.WS_PORT(), MyConfiguration.WS_PATH());

    await this.application_.listen(MyConfiguration.API_PORT());
    
    console.log('='.repeat(60));
    console.log('🚀 Backend server started successfully!');
    console.log(`📡 API Server: http://localhost:${MyConfiguration.API_PORT()}`);
    console.log(`🔌 WebSocket Server: ws://localhost:${MyConfiguration.WS_PORT()}${MyConfiguration.WS_PATH()}`);
    console.log(`🏥 Health Check: http://localhost:${MyConfiguration.API_PORT()}/health`);
    console.log(`🌍 Environment: ${MyConfiguration.NODE_ENV()}`);
    console.log('='.repeat(60));
  }

  public async close(): Promise<void> {
    if (this.application_) {
      const wsServer = this.application_.get(WebSocketServer);
      wsServer.stop();
      await this.application_.close();
    }
  }
}
