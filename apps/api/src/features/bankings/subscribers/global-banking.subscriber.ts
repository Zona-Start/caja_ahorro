import { EVENT_BUS_TOKEN, EventEnvelope, IEventBus } from '@/shared/event-bus';
import {
  ACCOUNTING_EVENTS,
  LOAN_EVENTS,
  PURCHASING_EVENTS,
} from '@/shared/event-types';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';

const HANDLER_NAME = 'GlobalBankingSubscriber';

@Injectable()
export class GlobalBankingSubscriber implements OnModuleInit {
  private readonly logger = new Logger(HANDLER_NAME);

  constructor(@Inject(EVENT_BUS_TOKEN) private readonly eventBus: IEventBus) {}

  onModuleInit() {
    this.eventBus.subscribe(
      LOAN_EVENTS.PAYMENT_CREATED,
      (envelope: EventEnvelope) => {
        this.logger.log(
          `Loan payment — banking reconciliation candidate: ${envelope.payload.customReference}`,
        );
      },
    );

    this.eventBus.subscribe(
      ACCOUNTING_EVENTS.ENTRY_POSTED,
      (envelope: EventEnvelope) => {
        this.logger.log(
          `Accounting entry posted — banking impact: ${envelope.payload.entryNumber}`,
        );
      },
    );

    this.eventBus.subscribe(
      PURCHASING_EVENTS.SUPPLIER_PAYMENT_CREATED,
      (envelope: EventEnvelope) => {
        this.logger.log(
          `Supplier payment — banking reconciliation: ${envelope.payload.amount}`,
        );
      },
    );

    this.logger.log(`${HANDLER_NAME} registered`);
  }
}
