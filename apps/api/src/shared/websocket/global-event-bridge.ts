import { EVENT_BUS_TOKEN, EventEnvelope, IEventBus } from '@/shared/event-bus';
import {
  ACCOUNTING_EVENTS,
  BANKING_EVENTS,
  INVENTORY_EVENTS,
  LOAN_EVENTS,
  PARTNER_EVENTS,
  PURCHASING_EVENTS,
} from '@/shared/event-types';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AppWsGateway } from './websocket.gateway';

const HANDLER_NAME = 'GlobalEventBridge';

@Injectable()
export class GlobalEventBridgeSubscriber implements OnModuleInit {
  private readonly logger = new Logger(HANDLER_NAME);

  private readonly ALL_EVENTS = [
    ...Object.values(LOAN_EVENTS),
    ...Object.values(INVENTORY_EVENTS),
    ...Object.values(ACCOUNTING_EVENTS),
    ...Object.values(BANKING_EVENTS),
    ...Object.values(PURCHASING_EVENTS),
    ...Object.values(PARTNER_EVENTS),
  ];

  constructor(
    @Inject(EVENT_BUS_TOKEN) private readonly eventBus: IEventBus,
    private readonly wsGateway: AppWsGateway,
  ) {}

  onModuleInit() {
    for (const event of this.ALL_EVENTS) {
      this.eventBus.subscribe(event, (envelope: EventEnvelope) => {
        try {
          if (!envelope.tenantId) {
            this.wsGateway.broadcastGlobal(event, envelope.payload);
          } else {
            this.wsGateway.broadcastToTenant(
              envelope.tenantId,
              event,
              envelope.payload,
            );
          }
        } catch (error) {
          this.logger.error(
            `WS broadcast failed for ${event}: ${(error as Error).message}`,
          );
        }
      });
    }

    this.logger.log(
      `${HANDLER_NAME} listening to ${this.ALL_EVENTS.length} event types`,
    );
  }
}
