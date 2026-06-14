import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { IEventBus, EVENT_BUS_TOKEN, EventEnvelope } from '@/shared/event-bus';
import { LOAN_EVENTS, ACCOUNTING_EVENTS, PURCHASING_EVENTS } from '@/shared/event-types';

const HANDLER_NAME = 'GlobalBankingSubscriber';

@Injectable()
export class GlobalBankingSubscriber implements OnModuleInit {
  private readonly logger = new Logger(HANDLER_NAME);

  constructor(
    @Inject(EVENT_BUS_TOKEN) private readonly eventBus: IEventBus,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe(LOAN_EVENTS.PAYMENT_CREATED, (envelope: EventEnvelope) => {
      this.logger.log(`Loan payment — banking reconciliation candidate: ${envelope.payload.customReference}`);
    });

    this.eventBus.subscribe(ACCOUNTING_EVENTS.ENTRY_POSTED, (envelope: EventEnvelope) => {
      this.logger.log(`Accounting entry posted — banking impact: ${envelope.payload.entryNumber}`);
    });

    this.eventBus.subscribe(PURCHASING_EVENTS.SUPPLIER_PAYMENT_CREATED, (envelope: EventEnvelope) => {
      this.logger.log(`Supplier payment — banking reconciliation: ${envelope.payload.amount}`);
    });

    this.logger.log(`${HANDLER_NAME} registered`);
  }
}
