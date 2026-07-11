import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { projectionLedgerBalances } from '@/database/schema';
import { type EventEnvelope, EventStoreService } from '@/shared/event-bus';
import { ACCOUNTING_EVENTS } from '@/shared/event-types';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { type ProjectionHandler } from './projection-handler';

@Injectable()
export class LedgerBalanceProjection implements ProjectionHandler {
  readonly name = 'LedgerBalanceProjection';
  private readonly logger = new Logger(this.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly eventStore: EventStoreService,
  ) {}

  async handle<T>(event: string, envelope: EventEnvelope<T>): Promise<void> {
    switch (event) {
      case ACCOUNTING_EVENTS.ENTRY_POSTED:
        await this.applyEntryPosted(envelope as any);
        break;
      case ACCOUNTING_EVENTS.ENTRY_CANCELLED:
        await this.applyEntryCancelled(envelope as any);
        break;
      case ACCOUNTING_EVENTS.CYCLE_CLOSED:
        await this.applyCycleClosed(envelope as any);
        break;
    }
  }

  async rebuild(): Promise<void> {
    this.logger.log('Rebuilding ledger balance projection from EventStore...');
    const entries = await this.eventStore.findByEventType(
      ACCOUNTING_EVENTS.ENTRY_POSTED,
    );

    await this.db.delete(projectionLedgerBalances);

    for (const event of entries) {
      if (event.envelope && typeof event.envelope === 'object') {
        const env = event.envelope as any;
        await this.handle(env.type ?? event.eventType, env);
      }
    }

    this.logger.log(`Rebuild complete: ${entries.length} events replayed`);
  }

  private async applyEntryPosted(envelope: EventEnvelope): Promise<void> {
    const { tenantId, entryId, totalDebit, totalCredit, cycleId } =
      envelope.payload;

    const existing = await this.db
      .select()
      .from(projectionLedgerBalances)
      .where(
        and(
          eq(projectionLedgerBalances.tenantId, tenantId),
          eq(projectionLedgerBalances.cycleId, cycleId ?? '__none__'),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      await this.db.insert(projectionLedgerBalances).values({
        tenantId,
        accountPlanId: entryId,
        cycleId: cycleId ?? null,
        totalDebit: String(totalDebit),
        totalCredit: String(totalCredit),
        balance: String(totalDebit - totalCredit),
        lastEventId: envelope.eventId,
      });
    } else {
      const current = existing[0];
      const newDebit = Number(current.totalDebit) + Number(totalDebit);
      const newCredit = Number(current.totalCredit) + Number(totalCredit);
      const newBalance = newDebit - newCredit;

      await this.db
        .update(projectionLedgerBalances)
        .set({
          totalDebit: String(newDebit),
          totalCredit: String(newCredit),
          balance: String(newBalance),
          lastEventId: envelope.eventId,
          updatedAt: new Date(),
        })
        .where(eq(projectionLedgerBalances.id, current.id));
    }
  }

  private async applyEntryCancelled(envelope: EventEnvelope): Promise<void> {
    const { tenantId, entryId, totalDebit, totalCredit } = envelope.payload;

    const existing = await this.db
      .select()
      .from(projectionLedgerBalances)
      .where(
        and(
          eq(projectionLedgerBalances.tenantId, tenantId),
          eq(projectionLedgerBalances.accountPlanId, entryId),
        ),
      )
      .limit(1);

    if (existing.length === 0) return;

    const current = existing[0];
    const newDebit = Number(current.totalDebit) - Number(totalDebit);
    const newCredit = Number(current.totalCredit) - Number(totalCredit);
    const newBalance = newDebit - newCredit;

    await this.db
      .update(projectionLedgerBalances)
      .set({
        totalDebit: String(newDebit >= 0 ? newDebit : 0),
        totalCredit: String(newCredit >= 0 ? newCredit : 0),
        balance: String(newBalance),
        lastEventId: envelope.eventId,
        updatedAt: new Date(),
      })
      .where(eq(projectionLedgerBalances.id, current.id));
  }

  private async applyCycleClosed(_envelope: EventEnvelope): Promise<void> {
    this.logger.log('Cycle closed — ledger balances finalized');
  }
}
