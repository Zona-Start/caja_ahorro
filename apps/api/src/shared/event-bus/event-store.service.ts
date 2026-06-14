import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { eventStore } from '@/database/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { type EventEnvelope } from './event-envelope';

@Injectable()
export class EventStoreService {
  private readonly logger = new Logger(EventStoreService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
  ) {}

  async store(envelope: EventEnvelope): Promise<void> {
    try {
      await this.db.insert(eventStore).values({
        eventId: envelope.eventId,
        eventType: envelope.type,
        aggregateId: envelope.aggregateId,
        tenantId: envelope.tenantId || null,
        payload: envelope.payload as any,
        envelope: envelope as any,
        status: 'PUBLISHED',
      });
    } catch (error) {
      this.logger.error(`Failed to store event ${envelope.eventId}: ${(error as Error).message}`);
    }
  }

  async findByAggregateId(aggregateId: string) {
    return this.db
      .select()
      .from(eventStore)
      .where(eq(eventStore.aggregateId, aggregateId))
      .orderBy(desc(eventStore.createdAt));
  }

  async findByTimeRange(from: Date, to: Date) {
    return this.db
      .select()
      .from(eventStore)
      .where(
        and(
          gte(eventStore.createdAt, from),
          lte(eventStore.createdAt, to),
        ),
      )
      .orderBy(desc(eventStore.createdAt));
  }

  async findByEventType(eventType: string) {
    return this.db
      .select()
      .from(eventStore)
      .where(eq(eventStore.eventType, eventType))
      .orderBy(desc(eventStore.createdAt));
  }

  async countByStatus(status: string) {
      const rows = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(eventStore)
        .where(eq(eventStore.status, status));
      return Number(rows[0]?.count ?? 0);
  }
}
