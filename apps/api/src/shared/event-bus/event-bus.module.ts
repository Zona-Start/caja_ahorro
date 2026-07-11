import { DrizzleModule } from '@/database/drizzle.module';
import { OutboxModule } from '@/shared/outbox';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CrossDomainModule } from './cross-domain.module';
import { DeadLetterQueueService } from './dead-letter-queue.service';
import { EVENT_BUS_TOKEN } from './event-bus.interface';
import { EventMetricsService } from './event-metrics.service';
import { EventRouter } from './event-router';
import { EventStoreService } from './event-store.service';
import { EventTracerService } from './event-tracer.service';
import { IdempotencyService } from './idempotency.service';
import { InProcessEventBus } from './in-process-event-bus';
import { RedisEventBus } from './redis-event-bus';
import { ReplayService } from './replay.service';
import { RetryManager } from './retry.manager';

@Global()
@Module({
  imports: [ConfigModule, DrizzleModule, CrossDomainModule, OutboxModule],
  providers: [
    InProcessEventBus,
    IdempotencyService,
    EventStoreService,
    DeadLetterQueueService,
    RetryManager,
    EventTracerService,
    EventMetricsService,
    ReplayService,
    EventRouter,
    {
      provide: EVENT_BUS_TOKEN,
      useClass: RedisEventBus,
    },
  ],
  exports: [
    EVENT_BUS_TOKEN,
    InProcessEventBus,
    IdempotencyService,
    EventStoreService,
    DeadLetterQueueService,
    RetryManager,
    EventTracerService,
    EventMetricsService,
    ReplayService,
    EventRouter,
  ],
})
export class EventBusModule {}
