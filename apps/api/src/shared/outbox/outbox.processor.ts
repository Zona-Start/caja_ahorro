import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { eventOutbox } from '@/database/schema';
import { eq, and, lte, asc, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { EventStoreService, type EventEnvelope } from '@/shared/event-bus';

const LOG = 'outbox';

@Injectable()
export class OutboxProcessor implements OnModuleDestroy {
  private readonly logger = new Logger(OutboxProcessor.name);
  private readonly pollIntervalMs: number;
  private readonly batchSize: number;
  private readonly maxRetries: number;
  private readonly baseBackoffMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private shuttingDown = false;

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly eventStore: EventStoreService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    this.pollIntervalMs = this.configService.get<number>('OUTBOX_POLL_MS') ?? 1000;
    this.batchSize = this.configService.get<number>('OUTBOX_BATCH_SIZE') ?? 100;
    this.maxRetries = this.configService.get<number>('OUTBOX_MAX_RETRIES') ?? 5;
    this.baseBackoffMs = this.configService.get<number>('OUTBOX_BACKOFF_MS') ?? 2000;
  }

  start(): void {
    if (this.timer) return;
    this.logger.log(
      `[${LOG}.started] pollMs=${this.pollIntervalMs} batch=${this.batchSize} maxRetries=${this.maxRetries} backoffMs=${this.baseBackoffMs}`,
    );
    this.timer = setInterval(() => this.processBatch(), this.pollIntervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.logger.log(`[${LOG}.stopped] processor halted`);
  }

  async flush(): Promise<void> {
    this.logger.log(`[${LOG}.flush.start] draining pending events...`);
    this.shuttingDown = true;
    let round = 0;

    while (round < 5) {
      const count = await this.processBatch();
      if (count === 0) break;
      round++;
    }

    const remaining = await this.countPending();
    if (remaining > 0) {
      this.logger.warn(`[${LOG}.flush.incomplete] ${remaining} events still PENDING`);
    } else {
      this.logger.log(`[${LOG}.flush.complete] all pending events drained`);
    }
  }

  async processBatch(): Promise<number> {
    if (this.running) return 0;
    this.running = true;

    try {
      const pending = await this.db
        .select()
        .from(eventOutbox)
        .where(
          and(
            eq(eventOutbox.status, 'PENDING'),
            lte(eventOutbox.retryCount, this.maxRetries),
          ),
        )
        .orderBy(asc(eventOutbox.createdAt))
        .limit(this.batchSize);

      if (pending.length === 0) return 0;

      this.logger.log(`[${LOG}.batch.start] count=${pending.length}`);

      let sent = 0;
      let failed = 0;

      for (const row of pending) {
        if (this.shuttingDown) break;
        const ok = await this.publishOne(row);
        if (ok) sent++;
        else failed++;
      }

      this.logger.log(
        `[${LOG}.batch.end] total=${pending.length} sent=${sent} failed=${failed}`,
      );

      return pending.length;
    } catch (error) {
      this.logger.error(`[${LOG}.batch.error] ${(error as Error).message}`);
      return 0;
    } finally {
      this.running = false;
    }
  }

  private async publishOne(
    row: typeof eventOutbox.$inferSelect,
  ): Promise<boolean> {
    const { id, eventId, eventType, aggregateId, tenantId, payload, retryCount } = row;

    const envelope: EventEnvelope = {
      eventId,
      type: eventType,
      aggregateId,
      tenantId: tenantId ?? '',
      timestamp: Date.now(),
      source: 'outbox',
      payload,
    };

    try {
      await this.eventStore.store(envelope);
      this.eventEmitter.emit(eventType, envelope);

      await this.db
        .update(eventOutbox)
        .set({ status: 'SENT', sentAt: new Date() })
        .where(eq(eventOutbox.id, id));

      this.logger.log(`[${LOG}.sent] event=${eventType} id=${eventId} aggregate=${aggregateId}`);
      return true;
    } catch (error) {
      const newRetryCount = retryCount + 1;
      const isFinal = newRetryCount >= this.maxRetries;
      const newStatus = isFinal ? 'FAILED' : 'PENDING';

      await this.db
        .update(eventOutbox)
        .set({ retryCount: newRetryCount, status: newStatus })
        .where(eq(eventOutbox.id, id));

      if (isFinal) {
        this.logger.error(
          `[${LOG}.failed] event=${eventType} id=${eventId} error=${(error as Error).message} retries=${newRetryCount}`,
        );
      } else {
        const backoff = this.computeBackoff(newRetryCount);
        this.logger.warn(
          `[${LOG}.retrying] event=${eventType} id=${eventId} attempt=${newRetryCount}/${this.maxRetries} backoff=${backoff}ms`,
        );
      }

      return false;
    }
  }

  private computeBackoff(retryCount: number): number {
    const exponential = Math.min(
      this.baseBackoffMs * Math.pow(2, retryCount - 1),
      30000,
    );
    const jitter = Math.random() * 0.3 * exponential;
    return Math.floor(exponential + jitter);
  }

  private async countPending(): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventOutbox)
      .where(eq(eventOutbox.status, 'PENDING'));
    return Number(rows[0]?.count ?? 0);
  }

  async onModuleDestroy(): Promise<void> {
    this.shuttingDown = true;
    this.stop();
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      await this.flush();
    }
  }
}
