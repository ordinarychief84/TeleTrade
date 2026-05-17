import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: '*' },
})
export class RealtimeGateway implements OnGatewayConnection {
  private readonly log = new Logger('Realtime');
  @WebSocketServer() server!: Server;

  handleConnection(socket: Socket) {
    this.log.debug(`Realtime client connected ${socket.id}`);
  }

  emitToRole(role: string, event: string, payload: unknown) {
    this.server?.to(`role:${role}`).emit(event, payload);
  }

  broadcast(event: string, payload: unknown) {
    this.server?.emit(event, payload);
  }
}
