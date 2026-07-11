import { Logger } from '@nestjs/common';
import {
  WebSocketGateway as NestWsGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@NestWsGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/events',
})
export class AppWsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AppWsGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const tenantId = client.handshake.query.tenantId as string;
    if (tenantId) {
      client.join(`tenant:${tenantId}`);
      this.logger.debug(`Client ${client.id} joined tenant:${tenantId}`);
    }
    client.join('global');
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client ${client.id} disconnected`);
  }

  broadcastToTenant<T>(tenantId: string, event: string, payload: T) {
    if (!this.server) return;
    this.server.to(`tenant:${tenantId}`).emit(event, {
      event,
      payload,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastGlobal<T>(event: string, payload: T) {
    if (!this.server) return;
    this.server.emit(event, {
      event,
      payload,
      timestamp: new Date().toISOString(),
    });
  }
}
