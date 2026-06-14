import { Module } from '@nestjs/common';
import { AppWsGateway } from './websocket.gateway';
import { GlobalEventBridgeSubscriber } from './global-event-bridge';

@Module({
  providers: [AppWsGateway, GlobalEventBridgeSubscriber],
  exports: [AppWsGateway],
})
export class WsModule {}
