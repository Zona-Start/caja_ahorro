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

  // async findAll(paginationDto: FilterSupplierTransactionDto) {
  //   const {
  //     page = 1,
  //     limit = 10,
  //     search = '',
  //     sortBy = 'id',
  //     sortOrder = 'asc',
  //     accountsPayableId,
  //     transactionType,
  //     status,
  //     startDate,
  //     endDate,
  //   } = paginationDto;
  //   const offset = (page - 1) * limit;

  //   let searchConditions: SQL<unknown>[] = [];
  //   if (search) {
  //     searchConditions.push(
  //       ilike(supplierTransactions.reference, `%${search}%`),
  //     );
  //   }
  //   if (accountsPayableId) {
  //     searchConditions.push(
  //       eq(supplierTransactions.accountsPayableId, accountsPayableId),
  //     );
  //   }
  //   if (transactionType) {
  //     searchConditions.push(
  //       eq(supplierTransactions.transactionType, transactionType as any),
  //     );
  //   }
  //   if (status) {
  //     searchConditions.push(eq(supplierTransactions.status, status as any));
  //   }
  //   if (startDate) {
  //     searchConditions.push(
  //       sql`${supplierTransactions.transactionDate} >= ${startDate}`,
  //     );
  //   }
  //   if (endDate) {
  //     searchConditions.push(
  //       sql`${supplierTransactions.transactionDate} <= ${endDate}`,
  //     );
  //   }

  //   const searchCondition = searchConditions.length
  //     ? and(...searchConditions)
  //     : undefined;

  //   const orderBy =
  //     sortOrder === 'asc'
  //       ? sql`${supplierTransactions[sortBy as keyof typeof supplierTransactions]} asc`
  //       : sql`${supplierTransactions[sortBy as keyof typeof supplierTransactions]} desc`;

  //   const data = await this.drizzle.query.supplierTransactions.findMany({
  //     where: searchCondition,
  //     limit: limit,
  //     offset: offset,
  //     orderBy: orderBy,
  //     with: {
  //       accountsPayable: true,
  //     },
  //   });

  //   const totalCountResult = await this.drizzle
  //     .select({ count: sql<number>`count(*)` })
  //     .from(supplierTransactions)
  //     .where(searchCondition);

  //   const totalCount = Number(totalCountResult[0].count);
  //   const totalPages = Math.ceil(totalCount / limit);

  //   const meta = {
  //     page: Number(page),
  //     limit: Number(limit),
  //     totalCount,
  //     totalPages,
  //     hasNextPage: page < totalPages,
  //     hasPreviousPage: page > 1,
  //     nextPage: page < totalPages ? page + 1 : null,
  //     previousPage: page > 1 ? page - 1 : null,
  //   };

  //   return { data, meta };
  // }

  // async findOne(id: number) {
  //   const data = await this.drizzle
  //     .select()
  //     .from(supplierTransactions)
  //     .leftJoin(
  //       schema.accountsPayable,
  //       eq(schema.accountsPayable.id, supplierTransactions.accountsPayableId),
  //     )
  //     .where(eq(supplierTransactions.id, id));

  //   if (data.length === 0) {
  //     throw new NotFoundException('Supplier transaction not found');
  //   }

  //   return data[0];
  // }

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
