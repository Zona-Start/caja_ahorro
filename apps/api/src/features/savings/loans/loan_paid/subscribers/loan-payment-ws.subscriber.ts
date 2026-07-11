import {
  createIdempotentHandler,
  DeadLetterQueueService,
  EVENT_BUS_TOKEN,
  EventEnvelope,
  EventMetricsService,
  EventTracerService,
  IdempotencyService,
  IEventBus,
  RetryManager,
} from '@/shared/event-bus';
import { AppWsGateway } from '@/shared/websocket';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  LOAN_PAYMENT_EVENTS,
  LoanPaymentCancelledEvent,
  LoanPaymentCompletedEvent,
  LoanPaymentCreatedEvent,
} from '../events/loan-payment.events';

const HANDLER_NAME = 'LoanPaymentWsSubscriber';

@Injectable()
export class LoanPaymentWsSubscriber implements OnModuleInit {
  private readonly logger = new Logger(HANDLER_NAME);

  constructor(
    @Inject(EVENT_BUS_TOKEN) private readonly eventBus: IEventBus,
    private readonly wsGateway: AppWsGateway,
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
        (envelope) => this.broadcastCreated(envelope),
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
        (envelope) => this.broadcastCancelled(envelope),
      ),
    );

    this.eventBus.subscribe<LoanPaymentCompletedEvent>(
      LOAN_PAYMENT_EVENTS.COMPLETED,
      createIdempotentHandler(
        {
          handlerName: `${HANDLER_NAME}.completed`,
          idempotencyService: this.idempotencyService,
          retryManager: this.retryManager,
          tracer: this.tracer,
          metrics: this.metrics,
          dlq: this.dlq,
        },
        (envelope) => this.broadcastCompleted(envelope),
      ),
    );

    this.logger.log(`${HANDLER_NAME} registered with reliability layer`);
  }

  private broadcastCreated(envelope: EventEnvelope<LoanPaymentCreatedEvent>) {
    this.wsGateway.broadcastToTenant(
      envelope.tenantId,
      LOAN_PAYMENT_EVENTS.CREATED,
      envelope.payload,
    );
  }

  private broadcastCancelled(
    envelope: EventEnvelope<LoanPaymentCancelledEvent>,
  ) {
    this.wsGateway.broadcastToTenant(
      envelope.tenantId,
      LOAN_PAYMENT_EVENTS.CANCELLED,
      envelope.payload,
    );
  }

  private broadcastCompleted(
    envelope: EventEnvelope<LoanPaymentCompletedEvent>,
  ) {
    this.wsGateway.broadcastToTenant(
      envelope.tenantId,
      LOAN_PAYMENT_EVENTS.COMPLETED,
      envelope.payload,
    );
  }
}
