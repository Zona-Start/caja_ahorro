import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { projectionLoanBalances, projectionCheckpoints, loans, loanPayments } from '@/database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';
import { type ProjectionHandler } from './projection-handler';
import { type EventEnvelope, EventStoreService } from '@/shared/event-bus';
import { LOAN_EVENTS } from '@/shared/event-types';

@Injectable()
export class LoanBalanceProjection implements ProjectionHandler {
  readonly name = 'LoanBalanceProjection';
  private readonly logger = new Logger(this.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly eventStore: EventStoreService,
  ) {}

  async handle<T>(event: string, envelope: EventEnvelope<T>): Promise<void> {
    switch (event) {
      case LOAN_EVENTS.PAYMENT_CREATED:
        await this.applyPaymentCreated(envelope as any);
        break;
      case LOAN_EVENTS.PAYMENT_CANCELLED:
        await this.applyPaymentCancelled(envelope as any);
        break;
      case LOAN_EVENTS.LOAN_DISBURSED:
        await this.applyLoanDisbursed(envelope as any);
        break;
      case LOAN_EVENTS.LOAN_CANCELLED:
        await this.applyLoanCancelled(envelope as any);
        break;
    }
  }

  async rebuild(): Promise<void> {
    this.logger.log('Rebuilding loan balance projection from EventStore...');
    const events = await this.eventStore.findByEventType(LOAN_EVENTS.PAYMENT_CREATED);
    const loanEvents = await this.eventStore.findByEventType(LOAN_EVENTS.LOAN_DISBURSED);

    await this.db.delete(projectionLoanBalances);

    for (const event of [...loanEvents, ...events]) {
      if (event.envelope && typeof event.envelope === 'object') {
        const env = event.envelope as any;
        await this.handle(env.type ?? event.eventType, env);
      }
    }

    this.logger.log(`Rebuild complete: ${loanEvents.length + events.length} events replayed`);
  }

  private async applyLoanDisbursed(envelope: EventEnvelope): Promise<void> {
    const { tenantId, loanId, associateId, amount } = envelope.payload;

    await this.db
      .insert(projectionLoanBalances)
      .values({
        tenantId,
        loanId,
        associateId,
        associateName: '',
        totalAmount: String(amount),
        paidAmount: '0',
        pendingBalance: String(amount),
        status: 'DISBURSED',
        lastEventId: envelope.eventId,
      })
      .onConflictDoUpdate({
        target: [projectionLoanBalances.tenantId, projectionLoanBalances.loanId],
        set: {
          totalAmount: String(amount),
          pendingBalance: String(amount),
          status: 'DISBURSED',
          lastEventId: envelope.eventId,
          updatedAt: new Date(),
        },
      });
  }

  private async applyPaymentCreated(envelope: EventEnvelope): Promise<void> {
    const { tenantId, loanId, amount } = envelope.payload;

    const existing = await this.db
      .select()
      .from(projectionLoanBalances)
      .where(
        and(
          eq(projectionLoanBalances.tenantId, tenantId),
          eq(projectionLoanBalances.loanId, loanId),
        ),
      )
      .limit(1);

    if (existing.length === 0) return;

    const current = existing[0];
    const currentPaid = Number(current.paidAmount);
    const currentTotal = Number(current.totalAmount);
    const newPaid = currentPaid + Number(amount);
    const newPending = currentTotal - newPaid;
    const newStatus = newPending <= 0 ? 'PAID' : 'IN_PAYMENT';

    await this.db
      .update(projectionLoanBalances)
      .set({
        paidAmount: String(newPaid),
        pendingBalance: String(newPending >= 0 ? newPending : 0),
        status: newStatus,
        lastEventId: envelope.eventId,
        updatedAt: new Date(),
      })
      .where(eq(projectionLoanBalances.id, current.id));
  }

  private async applyPaymentCancelled(envelope: EventEnvelope): Promise<void> {
    const { tenantId, loanId, amount } = envelope.payload;

    const existing = await this.db
      .select()
      .from(projectionLoanBalances)
      .where(
        and(
          eq(projectionLoanBalances.tenantId, tenantId),
          eq(projectionLoanBalances.loanId, loanId),
        ),
      )
      .limit(1);

    if (existing.length === 0) return;

    const current = existing[0];
    const currentPaid = Number(current.paidAmount);
    const currentTotal = Number(current.totalAmount);
    const newPaid = currentPaid - Number(amount);
    const newPending = currentTotal - newPaid;

    await this.db
      .update(projectionLoanBalances)
      .set({
        paidAmount: String(newPaid >= 0 ? newPaid : 0),
        pendingBalance: String(newPending),
        status: 'IN_PAYMENT',
        lastEventId: envelope.eventId,
        updatedAt: new Date(),
      })
      .where(eq(projectionLoanBalances.id, current.id));
  }

  private async applyLoanCancelled(envelope: EventEnvelope): Promise<void> {
    const { tenantId, loanId } = envelope.payload;

    await this.db
      .update(projectionLoanBalances)
      .set({
        status: 'CANCELLED',
        pendingBalance: '0',
        lastEventId: envelope.eventId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectionLoanBalances.tenantId, tenantId),
          eq(projectionLoanBalances.loanId, loanId),
        ),
      );
  }
}
