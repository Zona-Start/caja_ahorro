import { Module } from '@nestjs/common';
import { GlobalEventBridgeSubscriber } from './global-event-bridge';
import { AppWsGateway } from './websocket.gateway';

@Module({
  providers: [AppWsGateway, GlobalEventBridgeSubscriber],
  exports: [AppWsGateway],
})
export class WsModule {}
