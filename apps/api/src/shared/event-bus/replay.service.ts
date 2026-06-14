import { Injectable, Logger } from '@nestjs/common';
import { EventStoreService } from './event-store.service';
import { IEventBus, EVENT_BUS_TOKEN } from './event-bus.interface';
import { Inject } from '@nestjs/common';

@Injectable()
export class ReplayService {
  private readonly logger = new Logger(ReplayService.name);

  constructor(
    private readonly eventStore: EventStoreService,
    @Inject(EVENT_BUS_TOKEN) private readonly eventBus: IEventBus,
  ) {}

  async replayByAggregateId(aggregateId: string): Promise<number> {
    const events = await this.eventStore.findByAggregateId(aggregateId);
    let count = 0;

    for (const event of events) {
      if (event.envelope && typeof event.envelope === 'object') {
        const env = event.envelope as any;
        this.eventBus.publish(env.type ?? event.eventType, env.payload ?? {});
        count++;
      }
    }

    this.logger.log(`Replayed ${count} events for aggregate ${aggregateId}`);
    return count;
  }

  async replayByTimeRange(from: Date, to: Date): Promise<number> {
    const events = await this.eventStore.findByTimeRange(from, to);
    let count = 0;

    for (const event of events) {
      if (event.envelope && typeof event.envelope === 'object') {
        const env = event.envelope as any;
        this.eventBus.publish(env.type ?? event.eventType, env.payload ?? {});
        count++;
      }
    }

    this.logger.log(`Replayed ${count} events from ${from.toISOString()} to ${to.toISOString()}`);
    return count;
  }

  async replayByEventType(eventType: string): Promise<number> {
    const events = await this.eventStore.findByEventType(eventType);
    let count = 0;

    for (const event of events) {
      if (event.envelope && typeof event.envelope === 'object') {
        const env = event.envelope as any;
        this.eventBus.publish(env.type ?? event.eventType, env.payload ?? {});
        count++;
      }
    }

    this.logger.log(`Replayed ${count} events of type ${eventType}`);
    return count;
  }
}
