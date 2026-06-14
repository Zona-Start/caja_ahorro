import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IEventBus, EventHandler } from './event-bus.interface';
import { createEnvelope, type EventEnvelope, type EventSource } from './event-envelope';
import { EventStoreService } from './event-store.service';
import { EventTracerService } from './event-tracer.service';

@Injectable()
export class InProcessEventBus implements IEventBus {
  private readonly logger = new Logger(InProcessEventBus.name);
  private readonly env: string;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly eventStore: EventStoreService,
    private readonly tracer: EventTracerService,
    private readonly configService: ConfigService,
  ) {
    this.env = this.configService.get<string>('NODE_ENV') ?? 'development';
  }

  publish<T>(event: string, payload: T, source: EventSource = 'direct'): void {
    const envelope = createEnvelope(event, payload, undefined, source);
    const eventId = envelope.eventId;

    if (source === 'direct' && this.env === 'production') {
      this.logger.error(
        `[outbox.guard] DIRECT PUBLISH BLOCKED event=${event} id=${eventId}. ` +
        'Use outbox pattern: inject OutboxWriterService and call write(tx, event) inside your transaction.',
      );
      return;
    }

    this.logger.debug(`Event published: ${event} (id: ${eventId}, source: ${source})`);
    this.tracer.published(envelope);
    this.eventStore.store(envelope);
    this.eventEmitter.emit(event, envelope);
  }

  subscribe<T>(event: string, handler: EventHandler<EventEnvelope<T>>): void {
    this.eventEmitter.on(event, handler);
    this.logger.debug(`Handler subscribed to: ${event}`);
  }

  unsubscribe(event: string, handler: EventHandler): void {
    this.eventEmitter.off(event, handler);
  }
}
