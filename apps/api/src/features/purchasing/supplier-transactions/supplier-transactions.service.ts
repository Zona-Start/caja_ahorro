import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';

@Injectable()
export class SupplierTransactionsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async getSupplierTransactionAdvance(tenantId: string) {
    return this.drizzle
      .select({
        id: schema.supplierTransactions.id,
        transactionNumber: schema.supplierTransactions.transactionNumber,
        supplier: {
          id: schema.suppliers.id,
          name: schema.suppliers.name,
        },
        amount: schema.supplierTransactions.amount,
        availableAmount: schema.supplierAdvances.availableAmount,
        status: schema.supplierTransactions.status,
        statusPayment: schema.supplierAdvances.statusPayment,
        isAuthorizePayment: schema.supplierAdvances.isAuthorizePayment,
      })
      .from(schema.supplierTransactions)
      .leftJoin(
        schema.supplierAdvances,
        and(
          eq(
            schema.supplierAdvances.transactionId,
            schema.supplierTransactions.id,
          ),
          eq(schema.supplierAdvances.tenantId, tenantId),
        ),
      )
      .leftJoin(
        schema.suppliers,
        and(
          eq(schema.suppliers.id, schema.supplierTransactions.supplierId),
          eq(schema.suppliers.tenantId, tenantId),
        ),
      )
      .where(
        and(
          eq(schema.supplierTransactions.transactionType, 'ADVANCE'),
          eq(schema.supplierTransactions.tenantId, tenantId),
        ),
      );
  }

  async getSupplierTransactionNoteCredit(tenantId: string) {
    return this.drizzle
      .select({
        id: schema.supplierTransactions.id,
        transactionNumber: schema.supplierTransactions.transactionNumber,
        supplier: {
          id: schema.suppliers.id,
          name: schema.suppliers.name,
        },
        amount: schema.supplierTransactions.amount,
        reason: schema.supplierCreditNotes.reason,
        availableAmount: schema.supplierCreditNotes.availableAmount,
        status: schema.supplierTransactions.status,
        accountsPayable: {
          accountsPayableNumber: schema.accountsPayable.accountsPayableNumber,
        },
      })
      .from(schema.supplierTransactions)
      .leftJoin(
        schema.supplierCreditNotes,
        and(
          eq(
            schema.supplierCreditNotes.transactionId,
            schema.supplierTransactions.id,
          ),
          eq(schema.supplierCreditNotes.tenantId, tenantId),
        ),
      )
      .leftJoin(
        schema.suppliers,
        and(
          eq(schema.suppliers.id, schema.supplierTransactions.supplierId),
          eq(schema.suppliers.tenantId, tenantId),
        ),
      )
      .leftJoin(
        schema.accountsPayable,
        and(
          eq(
            schema.accountsPayable.id,
            schema.supplierCreditNotes.accountsPayableId,
          ),
          eq(schema.accountsPayable.tenantId, tenantId),
        ),
      )
      .where(
        and(
          eq(schema.supplierTransactions.transactionType, 'CREDIT_NOTE'),
          eq(schema.supplierTransactions.tenantId, tenantId),
        ),
      );
  }

  async getSupplierTransactionNoteDebit(tenantId: string) {
    return this.drizzle
      .select({
        id: schema.supplierTransactions.id,
        transactionNumber: schema.supplierTransactions.transactionNumber,
        supplier: {
          id: schema.suppliers.id,
          name: schema.suppliers.name,
        },
        amount: schema.supplierDebitNotes.amount,
        status: schema.supplierTransactions.status,
        reason: schema.supplierDebitNotes.reason,
        accountsPayable: {
          accountsPayableNumber: schema.accountsPayable.accountsPayableNumber,
        },
      })
      .from(schema.supplierTransactions)
      .leftJoin(
        schema.supplierDebitNotes,
        and(
          eq(
            schema.supplierDebitNotes.transactionId,
            schema.supplierTransactions.id,
          ),
          eq(schema.supplierDebitNotes.tenantId, tenantId),
        ),
      )
      .leftJoin(
        schema.suppliers,
        and(
          eq(schema.suppliers.id, schema.supplierTransactions.supplierId),
          eq(schema.suppliers.tenantId, tenantId),
        ),
      )
      .leftJoin(
        schema.accountsPayable,
        and(
          eq(
            schema.accountsPayable.id,
            schema.supplierDebitNotes.accountsPayableId,
          ),
          eq(schema.accountsPayable.tenantId, tenantId),
        ),
      )
      .where(
        and(
          eq(schema.supplierTransactions.transactionType, 'DEBIT_NOTE'),
          eq(schema.supplierTransactions.tenantId, tenantId),
        ),
      );
  }

  async autorizeAdvancePayment(
    tenantId: string,
    userId: string,
    id: string,
  ) {
    const [exist] = await this.drizzle
      .select()
      .from(schema.supplierTransactions)
      .where(
        and(
          eq(schema.supplierTransactions.id, id),
          eq(schema.supplierTransactions.tenantId, tenantId),
        ),
      );

    if (!exist) {
      throw new NotFoundException('Supplier Transaction Advance not found');
    }

    const [advanceExist] = await this.drizzle
      .select()
      .from(schema.supplierAdvances)
      .where(
        and(
          eq(schema.supplierAdvances.transactionId, id),
          eq(schema.supplierAdvances.tenantId, tenantId),
        ),
      );

    if (
      advanceExist.isAuthorizePayment === true &&
      advanceExist.statusPayment === 'PAID'
    ) {
      throw new BadRequestException(
        'The advance payment is already authorized for payment',
      );
    }
    await this.drizzle
      .update(schema.supplierAdvances)
      .set({
        isAuthorizePayment: true,
        updatedById: userId,
      })
      .where(
        and(
          eq(schema.supplierAdvances.transactionId, id),
          eq(schema.supplierAdvances.tenantId, tenantId),
        ),
      );

    return { message: 'Authorized successfully' };
  }
}
