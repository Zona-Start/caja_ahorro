import { supplierTransactions } from '@/database/schema/administration';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateSupplierTransactionDto } from './dto/create-supplier-transaction.dto';
import { FilterSupplierTransactionDto } from './dto/filter-supplier-transaction.dto';

@Injectable()
export class SupplierTransactionsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(paginationDto: FilterSupplierTransactionDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      accountsPayableId,
      transactionType,
      status,
      startDate,
      endDate,
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];
    if (search) {
      searchConditions.push(
        ilike(supplierTransactions.reference, `%${search}%`),
      );
    }
    if (accountsPayableId) {
      searchConditions.push(
        eq(supplierTransactions.accountsPayableId, accountsPayableId),
      );
    }
    if (transactionType) {
      searchConditions.push(
        eq(supplierTransactions.transactionType, transactionType as any),
      );
    }
    if (status) {
      searchConditions.push(eq(supplierTransactions.status, status as any));
    }
    if (startDate) {
      searchConditions.push(
        sql`${supplierTransactions.transactionDate} >= ${startDate}`,
      );
    }
    if (endDate) {
      searchConditions.push(
        sql`${supplierTransactions.transactionDate} <= ${endDate}`,
      );
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${supplierTransactions[sortBy as keyof typeof supplierTransactions]} asc`
        : sql`${supplierTransactions[sortBy as keyof typeof supplierTransactions]} desc`;

    const data = await this.drizzle.query.supplierTransactions.findMany({
      where: searchCondition,
      limit: limit,
      offset: offset,
      orderBy: orderBy,
      with: {
        accountsPayable: true,
      },
    });

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(supplierTransactions)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const meta = {
      page: Number(page),
      limit: Number(limit),
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return { data, meta };
  }

  async findOne(id: number) {
    const data = await this.drizzle.query.supplierTransactions.findFirst({
      where: eq(supplierTransactions.id, id),
      with: {
        accountsPayable: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Supplier transaction not found');
    }

    return data;
  }

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
}
