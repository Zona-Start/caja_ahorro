import { supplierTransactions } from '@/database/schema/tables';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateSupplierTransactionDto } from './dto/create-supplier-transaction.dto';

@Injectable()
export class SupplierTransactionsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(
    dto: CreateSupplierTransactionDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx || this.drizzle;
    const [newTransaction] = await db
      .insert(supplierTransactions)
      .values(dto as any)
      .returning();
    return newTransaction;
  }

  async getSupplierTransactionAdvance() {
    return this.drizzle
      .select({
        id: supplierTransactions.id,
        transactionNumber: supplierTransactions.transactionNumber,
        supplier: {
          id: schema.suppliers.id,
          name: schema.suppliers.name,
        },
        amount: supplierTransactions.amount,
        availableAmount: schema.supplierAdvances.availableAmount,
        status: supplierTransactions.status,
        statusPayment: schema.supplierAdvances.statusPayment,
        isAuthorizePayment: schema.supplierAdvances.isAuthorizePayment,
      })
      .from(supplierTransactions)
      .leftJoin(
        schema.supplierAdvances,
        eq(schema.supplierAdvances.transactionId, supplierTransactions.id),
      )
      .leftJoin(
        schema.suppliers,
        eq(schema.suppliers.id, supplierTransactions.supplierId),
      )
      .where(eq(supplierTransactions.transactionType, 'ADVANCE'));
  }

  async getSupplierTransactionNoteCredit() {
    return this.drizzle
      .select({
        id: supplierTransactions.id,
        transactionNumber: supplierTransactions.transactionNumber,
        supplier: {
          id: schema.suppliers.id,
          name: schema.suppliers.name,
        },
        amount: supplierTransactions.amount,
        reason: schema.supplierCreditNotes.reason,
        availableAmount: schema.supplierCreditNotes.availableAmount,
        status: supplierTransactions.status,
        accountsPayable: {
          accountsPayableNumber: schema.accountsPayable.accountsPayableNumber,
        },
      })
      .from(supplierTransactions)
      .leftJoin(
        schema.supplierCreditNotes,
        eq(schema.supplierCreditNotes.transactionId, supplierTransactions.id),
      )
      .leftJoin(
        schema.suppliers,
        eq(schema.suppliers.id, supplierTransactions.supplierId),
      )
      .leftJoin(
        schema.accountsPayable,
        eq(
          schema.accountsPayable.id,
          schema.supplierCreditNotes.accountsPayableId,
        ),
      )
      .where(eq(supplierTransactions.transactionType, 'CREDIT_NOTE'));
  }

  async getSupplierTransactionNoteDebit() {
    return this.drizzle
      .select({
        id: supplierTransactions.id,
        transactionNumber: supplierTransactions.transactionNumber,
        supplier: {
          id: schema.suppliers.id,
          name: schema.suppliers.name,
        },
        amount: schema.supplierDebitNotes.amount,
        status: supplierTransactions.status,
        reason: schema.supplierDebitNotes.reason,
        accountsPayable: {
          accountsPayableNumber: schema.accountsPayable.accountsPayableNumber,
        },
      })
      .from(supplierTransactions)
      .leftJoin(
        schema.supplierDebitNotes,
        eq(schema.supplierDebitNotes.transactionId, supplierTransactions.id),
      )
      .leftJoin(
        schema.suppliers,
        eq(schema.suppliers.id, supplierTransactions.supplierId),
      )
      .leftJoin(
        schema.accountsPayable,
        eq(
          schema.accountsPayable.id,
          schema.supplierDebitNotes.accountsPayableId,
        ),
      )
      .where(eq(supplierTransactions.transactionType, 'DEBIT_NOTE'));
  }

  //meotod para autorizar el pago de una cuenta por pagar
  async autorizeAdvancePayment(userId: number, id: number) {
    const exist = await this.drizzle
      .select()
      .from(supplierTransactions)
      .where(eq(supplierTransactions.id, id));

    if (exist.length === 0) {
      throw new NotFoundException('Supplier Transaction Advance not found');
    }

    const advanceExist = await this.drizzle
      .select()
      .from(schema.supplierAdvances)
      .where(eq(schema.supplierAdvances.transactionId, id));

    if (
      advanceExist[0].isAuthorizePayment === true &&
      advanceExist[0].statusPayment === 'PAID'
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
      .where(eq(schema.supplierAdvances.transactionId, id));
  }
}
