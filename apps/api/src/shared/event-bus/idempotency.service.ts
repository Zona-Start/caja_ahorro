import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { processedEvents } from '@/database/schema';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
  ) {}

  async isProcessed(eventId: string, handlerName: string): Promise<boolean> {
    try {
      const row = await this.db
        .select({ id: processedEvents.id })
        .from(processedEvents)
        .where(
          and(
            eq(processedEvents.eventId, eventId),
            eq(processedEvents.handlerName, handlerName),
          ),
        )
        .limit(1);

      return row.length > 0;
    } catch (error) {
      this.logger.error(
        `Idempotency check failed for event ${eventId}/${handlerName}: ${(error as Error).message}`,
      );
      return false;
    }
  }

  async markProcessed(
    eventId: string,
    eventType: string,
    aggregateId: string,
    handlerName: string,
  ): Promise<void> {
    try {
      await this.db.insert(processedEvents).values({
        eventId,
        eventType,
        aggregateId,
        handlerName,
      });
    } catch (error) {
      this.logger.error(
        `Failed to mark event ${eventId} as processed by ${handlerName}: ${(error as Error).message}`,
      );
    }
  }
}
