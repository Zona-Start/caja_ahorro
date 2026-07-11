import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { deadLetterQueue } from '@/database/schema';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { EVENT_BUS_TOKEN, IEventBus } from './event-bus.interface';
import { type EventEnvelope } from './event-envelope';

@Injectable()
export class DeadLetterQueueService {
  private readonly logger = new Logger(DeadLetterQueueService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    @Inject(EVENT_BUS_TOKEN) private readonly eventBus: IEventBus,
  ) {}

  async push(
    envelope: EventEnvelope,
    handlerName: string,
    error: Error,
    retryCount: number,
    maxRetries: number,
  ): Promise<void> {
    try {
      await this.db.insert(deadLetterQueue).values({
        eventId: envelope.eventId,
        eventType: envelope.type,
        aggregateId: envelope.aggregateId,
        tenantId: envelope.tenantId || null,
        payload: envelope.payload as any,
        envelope: envelope as any,
        handlerName,
        errorMessage: error.message,
        errorStack: error.stack ?? null,
        retryCount,
        maxRetries,
        status: 'FAILED',
        lastRetryAt: new Date(),
      });
      this.logger.warn(
        `Event ${envelope.eventId} moved to DLQ after ${retryCount} retries (handler: ${handlerName})`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to push event ${envelope.eventId} to DLQ: ${(err as Error).message}`,
      );
    }
  }

  async findAll(filter?: { status?: string; handlerName?: string }) {
    const conditions: ReturnType<typeof eq>[] = [];
    if (filter?.status)
      conditions.push(eq(deadLetterQueue.status, filter.status));
    if (filter?.handlerName)
      conditions.push(eq(deadLetterQueue.handlerName, filter.handlerName));

    return this.db
      .select()
      .from(deadLetterQueue)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(deadLetterQueue.failedAt));
  }

  async retryOne(id: string): Promise<void> {
    const row = await this.db
      .select()
      .from(deadLetterQueue)
      .where(eq(deadLetterQueue.id, id))
      .limit(1);

    if (!row.length) return;

    const entry = row[0];
    const envelope = entry.envelope as unknown as EventEnvelope;

    await this.db
      .update(deadLetterQueue)
      .set({ status: 'RETRYING', lastRetryAt: new Date() })
      .where(eq(deadLetterQueue.id, id));

    this.eventBus.publish(envelope.type, envelope.payload);
  }

  async retryAll(): Promise<number> {
    const entries = await this.db
      .select()
      .from(deadLetterQueue)
      .where(eq(deadLetterQueue.status, 'FAILED'));

    for (const entry of entries) {
      const envelope = entry.envelope as unknown as EventEnvelope;
      await this.db
        .update(deadLetterQueue)
        .set({ status: 'RETRYING', lastRetryAt: new Date() })
        .where(eq(deadLetterQueue.id, entry.id));

      this.eventBus.publish(envelope.type, envelope.payload);
    }

    return entries.length;
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(deadLetterQueue).where(eq(deadLetterQueue.id, id));
  }

  async count(): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(deadLetterQueue)
      .where(eq(deadLetterQueue.status, 'FAILED'));
    return Number(rows[0]?.count ?? 0);
  }
}
