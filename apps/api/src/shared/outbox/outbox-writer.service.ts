import { eventOutbox } from '@/database/schema';
import { Injectable, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface OutboxWriteEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  tenantId: string;
  payload: any;
}

@Injectable()
export class OutboxWriterService {
  private readonly logger = new Logger(OutboxWriterService.name);

  async write(tx: NodePgDatabase<any>, event: OutboxWriteEvent): Promise<void> {
    await tx.insert(eventOutbox).values({
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      tenantId: event.tenantId || null,
      payload: event.payload,
      status: 'PENDING',
      retryCount: 0,
    });

    this.logger.log(
      `[outbox.created] event=${event.eventType} id=${event.eventId} aggregate=${event.aggregateId}`,
    );
  }

  async writeMany(
    tx: NodePgDatabase<any>,
    events: OutboxWriteEvent[],
  ): Promise<void> {
    if (events.length === 0) return;

    await tx.insert(eventOutbox).values(
      events.map((e) => ({
        eventId: e.eventId,
        eventType: e.eventType,
        aggregateId: e.aggregateId,
        tenantId: e.tenantId || null,
        payload: e.payload,
        status: 'PENDING',
        retryCount: 0,
      })),
    );

    this.logger.log(
      `[outbox.created] batch=${events.length} events=[${events.map((e) => e.eventType).join(', ')}]`,
    );
  }
}
