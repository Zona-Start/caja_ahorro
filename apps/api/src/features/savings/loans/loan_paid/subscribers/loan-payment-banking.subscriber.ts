import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  IEventBus, EVENT_BUS_TOKEN, IdempotencyService,
  RetryManager, EventTracerService, EventMetricsService,
  DeadLetterQueueService, createIdempotentHandler, EventEnvelope,
} from '@/shared/event-bus';
import { LOAN_PAYMENT_EVENTS, LoanPaymentCreatedEvent, LoanPaymentCancelledEvent } from '../events/loan-payment.events';

const HANDLER_NAME = 'LoanPaymentBankingSubscriber';

@Injectable()
export class LoanPaymentBankingSubscriber implements OnModuleInit {
  private readonly logger = new Logger(HANDLER_NAME);

  constructor(
    @Inject(EVENT_BUS_TOKEN) private readonly eventBus: IEventBus,
    private readonly idempotencyService: IdempotencyService,
    private readonly retryManager: RetryManager,
    private readonly tracer: EventTracerService,
    private readonly metrics: EventMetricsService,
    private readonly dlq: DeadLetterQueueService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe<LoanPaymentCreatedEvent>(
      LOAN_PAYMENT_EVENTS.CREATED,
      createIdempotentHandler(
        {
          handlerName: `${HANDLER_NAME}.created`,
          idempotencyService: this.idempotencyService,
          retryManager: this.retryManager,
          tracer: this.tracer,
          metrics: this.metrics,
          dlq: this.dlq,
        },
        (envelope) => this.handlePaymentCreated(envelope),
      ),
    );

    this.eventBus.subscribe<LoanPaymentCancelledEvent>(
      LOAN_PAYMENT_EVENTS.CANCELLED,
      createIdempotentHandler(
        {
          handlerName: `${HANDLER_NAME}.cancelled`,
          idempotencyService: this.idempotencyService,
          retryManager: this.retryManager,
          tracer: this.tracer,
          metrics: this.metrics,
          dlq: this.dlq,
        },
        (envelope) => this.handlePaymentCancelled(envelope),
      ),
    );

    this.logger.log(`${HANDLER_NAME} registered with reliability layer`);
  }

  private handlePaymentCreated(envelope: EventEnvelope<LoanPaymentCreatedEvent>) {
    this.logger.debug(`Banking event: payment ${envelope.payload.customReference} for loan ${envelope.payload.loanId}, amount ${envelope.payload.amount}`);
  }

  private handlePaymentCancelled(envelope: EventEnvelope<LoanPaymentCancelledEvent>) {
    this.logger.debug(`Banking event: payment ${envelope.payload.customReference} cancelled for loan ${envelope.payload.loanId}`);
  }
}
