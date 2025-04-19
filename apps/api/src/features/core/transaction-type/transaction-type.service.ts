import { PaginationDto } from '@/common/dto/pagination.dto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateTransactionTypeDto } from './dto/create-transaction-type.dto';
import { UpdateTransactionTypeDto } from './dto/update-transaction-type.dto';
import { TransactionType } from './entities/transaction-type.entity';

@Injectable()
export class TransactionTypeService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findTransactionTypeByCode(code: string) {
    return this.drizzle
      .select()
      .from(schema.transactionType)
      .where(eq(schema.transactionType.code, code));
  }

  async create(
    userId: string,
    createTransactionTypeDto: CreateTransactionTypeDto,
  ) {
    const find = await this.findTransactionTypeByCode(
      createTransactionTypeDto.code,
    );
    if (find.length !== 0) {
      throw new NotFoundException(`Transaction Type already exists`);
    }

    // Convert Date objects to string format for database insertion
    const transactionTypeData = {
      ...createTransactionTypeDto,
      deferredDate: createTransactionTypeDto.deferredDate.toISOString(),
      dateCanceled: createTransactionTypeDto.dateCanceled?.toISOString(), // Convert dateCanceled to ISO string if it exists
      createdById: parseInt(userId),
    };

    const transaction = await this.drizzle
      .insert(schema.transactionType)
      .values(transactionTypeData)
      .returning();

    const transformData = transaction.map((item: any) => {
      return {
        ...item,
        deferredDate: item.deferredDate ? new Date(item.deferredDate) : null,
        dateCanceled: item.dateCanceled ? new Date(item.dateCanceled) : null,
      };
    });

    return transformData[0];
  }

  findAll() {
    return this.drizzle
      .select({
        id: schema.transactionType.id,
        code: schema.transactionType.code,
        description: schema.transactionType.description,
        deferredDate: schema.transactionType.deferredDate,
        dateCanceled: schema.transactionType.dateCanceled,
        deferredNumber: schema.transactionType.deferredNumber,
        numberCanceled: schema.transactionType.numberCanceled,
        associatedAccount: schema.transactionType.associatedAccount,
        employerAccount: schema.transactionType.employerAccount,
        loanAccount: schema.transactionType.loanAccount,
      })
      .from(schema.transactionType);
  }

  findOne(id: number) {
    return this.drizzle
      .select()
      .from(schema.transactionType)
      .where(eq(schema.transactionType.id, id));
  }

  async findAllByPagination(
    paginationDto?: PaginationDto,
  ): Promise<{ data: TransactionType[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
    } = paginationDto || {};

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build search condition
    let searchCondition: SQL<unknown> | undefined;
    if (search) {
      searchCondition = ilike(
        schema.transactionType.description,
        `%${search}%`,
      );
    }

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${schema.transactionType[sortBy as keyof typeof schema.transactionType]} asc`
        : sql`${schema.transactionType[sortBy as keyof typeof schema.transactionType]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.transactionType)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.drizzle
      .select({
        id: schema.transactionType.id,
        code: schema.transactionType.code,
        description: schema.transactionType.description,
        deferredDate: schema.transactionType.deferredDate,
        dateCanceled: schema.transactionType.dateCanceled,
        deferredNumber: schema.transactionType.deferredNumber,
        numberCanceled: schema.transactionType.numberCanceled,
        associatedAccount: schema.transactionType.associatedAccount,
        employerAccount: schema.transactionType.employerAccount,
        loanAccount: schema.transactionType.loanAccount,
      })
      .from(schema.transactionType)
      .where(searchCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const transformData = data.map((item: any) => {
      return {
        ...item,
        deferredDate: item.deferredDate ? new Date(item.deferredDate) : null,
        dateCanceled: item.dateCanceled ? new Date(item.dateCanceled) : null,
      };
    });

    // Build pagination metadata
    const meta = {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return { data: transformData, meta };
  }

  async update(
    id: number,
    userId: string,
    updateTransactionTypeDto: UpdateTransactionTypeDto,
  ) {
    const existingTransactionType = await this.findOne(id);

    console.log(existingTransactionType);

    if (existingTransactionType.length === 0) {
      throw new NotFoundException(
        `Update Transaction Type with ID ${id} not found`,
      );
    }

    // Convert Date objects to string format for database insertion
    const transactionTypeData = {
      ...updateTransactionTypeDto,
      deferredDate: updateTransactionTypeDto.deferredDate?.toISOString(),
      dateCanceled: updateTransactionTypeDto.dateCanceled?.toISOString(), // Convert dateCanceled to ISO string if it exists
      updatedById: parseInt(userId),
    };

    console.log('data transofrmada:', transactionTypeData);

    const result = await this.drizzle
      .update(schema.transactionType)
      .set({
        ...transactionTypeData,
      })
      .where(eq(schema.transactionType.id, id))
      .returning();

    const transformData = result.map((item: any) => {
      return {
        ...item,
        deferredDate: item.deferredDate ? new Date(item.deferredDate) : null,
        dateCanceled: item.dateCanceled ? new Date(item.dateCanceled) : null,
      };
    });

    return transformData[0];
  }

  async remove(id: number) {
    const existingTransactionType = await this.findOne(id);

    if (!existingTransactionType) {
      throw new NotFoundException(
        `Delete Transaction Type with ID ${id} not found`,
      );
    }

    await this.drizzle
      .delete(schema.transactionType)
      .where(eq(schema.transactionType.id, id));

    return { message: 'Transaction Type deleted successfully' };
  }
}
