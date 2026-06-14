import { type EventEnvelope } from './event-envelope';
import { IdempotencyService } from './idempotency.service';
import { RetryManager } from './retry.manager';
import { EventTracerService } from './event-tracer.service';
import { EventMetricsService } from './event-metrics.service';
import { DeadLetterQueueService } from './dead-letter-queue.service';
import { EventStoreService } from './event-store.service';

export interface IdempotentHandlerOptions {
  handlerName: string;
  idempotencyService: IdempotencyService;
  retryManager: RetryManager;
  tracer: EventTracerService;
  metrics: EventMetricsService;
  dlq: DeadLetterQueueService;
  eventStore?: EventStoreService;
}

export function createIdempotentHandler<T>(
  options: IdempotentHandlerOptions,
  handler: (envelope: EventEnvelope<T>) => Promise<void> | void,
): (envelope: EventEnvelope<T>) => Promise<void> {
  const { handlerName, idempotencyService, retryManager, tracer, metrics, dlq } = options;

  return async (envelope: EventEnvelope<T>): Promise<void> => {
    try {
      const processed = await idempotencyService.isProcessed(envelope.eventId, handlerName);
      if (processed) {
        tracer.skipped(handlerName, envelope);
        return;
      }

      tracer.received(handlerName, envelope);

      const maxRetries = retryManager.getConfig(handlerName).maxRetries;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          await handler(envelope);

          await idempotencyService.markProcessed(
            envelope.eventId,
            envelope.type,
            envelope.aggregateId,
            handlerName,
          );

          tracer.processed(handlerName, envelope);
          metrics.incrementProcessed(envelope.type);
          return;
        } catch (error) {
          const err = error as Error;

          if (retryManager.shouldRetry(handlerName, attempt)) {
            tracer.retried(handlerName, envelope, attempt + 1);
            metrics.incrementRetried(envelope.type);
            await retryManager.sleep(handlerName, attempt);
          } else {
            tracer.failed(handlerName, envelope, err);
            metrics.incrementFailed(envelope.type);

            await dlq.push(
              envelope,
              handlerName,
              err,
              attempt + 1,
              maxRetries,
            );
            metrics.incrementDlq(envelope.type);
            tracer.dlq(handlerName, envelope, err);
            return;
          }
        }
      }
    } catch (error) {
      metrics.incrementFailed(envelope.type);
      tracer.failed(handlerName, envelope, error as Error);
    }
  };
}
