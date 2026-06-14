import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '@/database/drizzle.module';
import { InProcessEventBus } from './in-process-event-bus';
import { RedisEventBus } from './redis-event-bus';
import { EVENT_BUS_TOKEN } from './event-bus.interface';
import { IdempotencyService } from './idempotency.service';
import { EventStoreService } from './event-store.service';
import { DeadLetterQueueService } from './dead-letter-queue.service';
import { RetryManager } from './retry.manager';
import { EventTracerService } from './event-tracer.service';
import { EventMetricsService } from './event-metrics.service';
import { ReplayService } from './replay.service';
import { EventRouter } from './event-router';
import { CrossDomainModule } from './cross-domain.module';
import { OutboxModule } from '@/shared/outbox';

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
