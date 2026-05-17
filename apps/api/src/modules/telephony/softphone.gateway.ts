import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({
  namespace: '/softphone',
  cors: { origin: '*', credentials: false },
})
export class SoftphoneGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly log = new Logger('Softphone');
  @WebSocketServer() server!: Server;

  handleConnection(client: Socket) {
    this.log.debug(`softphone connect ${client.id}`);
  }
  handleDisconnect(client: Socket) {
    this.log.debug(`softphone disconnect ${client.id}`);
  }

  broadcast(event: string, payload: unknown) {
    this.server?.emit(event, payload);
  }
}
