import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { IEventBus, EVENT_BUS_TOKEN, EventEnvelope } from '@/shared/event-bus';
import { LOAN_EVENTS, INVENTORY_EVENTS, BANKING_EVENTS, PURCHASING_EVENTS } from '@/shared/event-types';

const HANDLER_NAME = 'GlobalAccountingSubscriber';

@Injectable()
export class GlobalAccountingSubscriber implements OnModuleInit {
  private readonly logger = new Logger(HANDLER_NAME);

  constructor(
    @Inject(EVENT_BUS_TOKEN) private readonly eventBus: IEventBus,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe(LOAN_EVENTS.PAYMENT_CREATED, (envelope: EventEnvelope) => {
      this.logger.log(`Loan payment created — accounting flow triggered: ${envelope.payload.customReference}`);
    });

    this.eventBus.subscribe(INVENTORY_EVENTS.MOVEMENT_CREATED, (envelope: EventEnvelope) => {
      this.logger.log(`Inventory movement — accounting flow triggered: ${envelope.payload.movementId}`);
    });

    this.eventBus.subscribe(BANKING_EVENTS.MOVEMENT_CREATED, (envelope: EventEnvelope) => {
      this.logger.log(`Bank movement created — accounting flow triggered: ${envelope.payload.movementId}`);
    });

    this.eventBus.subscribe(PURCHASING_EVENTS.SUPPLIER_INVOICE_ACCOUNTED, (envelope: EventEnvelope) => {
      this.logger.log(`Supplier invoice accounted — accounting sync: ${envelope.payload.invoiceNumber}`);
    });

    this.logger.log(`${HANDLER_NAME} registered`);
  }
}
