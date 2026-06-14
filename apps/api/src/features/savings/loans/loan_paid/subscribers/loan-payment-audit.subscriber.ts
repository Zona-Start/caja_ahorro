import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  IEventBus, EVENT_BUS_TOKEN, IdempotencyService,
  RetryManager, EventTracerService, EventMetricsService,
  DeadLetterQueueService, createIdempotentHandler, EventEnvelope,
} from '@/shared/event-bus';
import { LoanPaymentAudit } from '../domain/loan-payment.audit';
import { LOAN_PAYMENT_EVENTS, LoanPaymentCreatedEvent, LoanPaymentCancelledEvent } from '../events/loan-payment.events';

const HANDLER_NAME = 'LoanPaymentAuditSubscriber';

@Injectable()
export class LoanPaymentAuditSubscriber implements OnModuleInit {
  private readonly logger = new Logger(HANDLER_NAME);

  constructor(
    @Inject(EVENT_BUS_TOKEN) private readonly eventBus: IEventBus,
    private readonly audit: LoanPaymentAudit,
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
    const { payload } = envelope;
    this.audit.logPaymentCreated(
      '',
      '',
      payload.paymentId,
      payload.customReference,
      {
        loanId: payload.loanId,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        customReference: payload.customReference,
      },
    );
  }

  private handlePaymentCancelled(envelope: EventEnvelope<LoanPaymentCancelledEvent>) {
    const { payload } = envelope;
    this.audit.logPaymentCancelled('', payload.paymentId, payload.customReference);
  }
}
