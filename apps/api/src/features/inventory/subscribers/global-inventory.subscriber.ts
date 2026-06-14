import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { IEventBus, EVENT_BUS_TOKEN, EventEnvelope } from '@/shared/event-bus';
import { PURCHASING_EVENTS } from '@/shared/event-types';

const HANDLER_NAME = 'GlobalInventorySubscriber';

@Injectable()
export class GlobalInventorySubscriber implements OnModuleInit {
  private readonly logger = new Logger(HANDLER_NAME);

  constructor(
    @Inject(EVENT_BUS_TOKEN) private readonly eventBus: IEventBus,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe(PURCHASING_EVENTS.ORDER_CREATED, (envelope: EventEnvelope) => {
      this.logger.log(`Purchase order created — inventory commitment: ${envelope.payload.orderNumber}`);
    });

    this.eventBus.subscribe(PURCHASING_EVENTS.SUPPLIER_INVOICE_ACCOUNTED, (envelope: EventEnvelope) => {
      this.logger.log(`Invoice accounted — inventory stock update: ${envelope.payload.invoiceNumber}`);
    });

    this.logger.log(`${HANDLER_NAME} registered`);
  }
}
