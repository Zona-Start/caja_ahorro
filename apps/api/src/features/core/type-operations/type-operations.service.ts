import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { typeOperations } from 'src/database/index';
import { CreateTypeOperationsDto } from './dto/create-type-operations.dto';
import { FilterTypeOperationsDto } from './dto/filter-type-operations.dto';
import { UpdateTypeOperationsDto } from './dto/update-type-operations.dto';
import { TypeOperations } from './entities/type-operations.entity';

@Injectable()
export class TypeOperationsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findTransactionTypeByCode(code: string) {
    return this.drizzle
      .select()
      .from(typeOperations)
      .where(eq(typeOperations.code, code));
  }

  async create(
    userId: string,
    createTypeOperationsDto: CreateTypeOperationsDto,
  ) {
    const find = await this.findTransactionTypeByCode(
      createTypeOperationsDto.code,
    );
    if (find.length !== 0) {
      throw new NotFoundException(`Transaction Type already exists`);
    }

    // Convert Date objects to string format for database insertion
    const transactionTypeData = {
      ...createTypeOperationsDto,
      deferredDate: createTypeOperationsDto.deferredDate
        ? createTypeOperationsDto.deferredDate.toISOString()
        : null,
      dateCanceled: createTypeOperationsDto.dateCanceled
        ? createTypeOperationsDto.dateCanceled?.toISOString()
        : null, // Convert dateCanceled to ISO string if it exists
      createdById: parseInt(userId),
    };

    const transaction = await this.drizzle
      .insert(typeOperations)
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
        id: typeOperations.id,
        code: typeOperations.code,
        description: typeOperations.description,
        deferredDate: typeOperations.deferredDate,
        dateCanceled: typeOperations.dateCanceled,
        deferredNumber: typeOperations.deferredNumber,
        numberCanceled: typeOperations.numberCanceled,
        group: typeOperations.group,
        metadata: typeOperations.metadata,
        associatedAccount: typeOperations.associatedAccount,
        employerAccount: typeOperations.employerAccount,
        loanAccount: typeOperations.loanAccount,
      })
      .from(typeOperations);
  }

  findOne(id: number) {
    return this.drizzle
      .select({
        id: typeOperations.id,
        code: typeOperations.code,
        description: typeOperations.description,
        deferredDate: typeOperations.deferredDate,
        dateCanceled: typeOperations.dateCanceled,
        deferredNumber: typeOperations.deferredNumber,
        numberCanceled: typeOperations.numberCanceled,
        group: typeOperations.group,
        metadata: typeOperations.metadata,
        associatedAccount: typeOperations.associatedAccount,
        employerAccount: typeOperations.employerAccount,
        loanAccount: typeOperations.loanAccount,
      })
      .from(typeOperations)
      .where(eq(typeOperations.id, id));
  }

  async findAllByPagination(
    filterTypeOperationsDto?: FilterTypeOperationsDto,
  ): Promise<{ data: TypeOperations[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      group = '',
    } = filterTypeOperationsDto || {};

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build search condition
    let searchCondition: SQL<unknown> | undefined;
    if (search) {
      searchCondition = ilike(typeOperations.description, `%${search}%`);
    }

    // Agregué una condición para filtrar por grupo si el parámetro `group` está presente.
    if (group) {
      searchCondition = searchCondition
        ? sql`${searchCondition} AND ${typeOperations.group} = ${group}`
        : sql`${typeOperations.group} = ${group}`;
    }

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${typeOperations[sortBy as keyof typeof typeOperations]} asc`
        : sql`${typeOperations[sortBy as keyof typeof typeOperations]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(typeOperations)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.drizzle
      .select({
        id: typeOperations.id,
        code: typeOperations.code,
        description: typeOperations.description,
        deferredDate: typeOperations.deferredDate,
        dateCanceled: typeOperations.dateCanceled,
        deferredNumber: typeOperations.deferredNumber,
        numberCanceled: typeOperations.numberCanceled,
        group: typeOperations.group,
        metadata: typeOperations.metadata,
        associatedAccount: typeOperations.associatedAccount,
        employerAccount: typeOperations.employerAccount,
        loanAccount: typeOperations.loanAccount,
      })
      .from(typeOperations)
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
    updateTypeOperationsDto: UpdateTypeOperationsDto,
  ) {
    const existingTransactionType = await this.findOne(id);

    if (existingTransactionType.length === 0) {
      throw new NotFoundException(
        `Update Transaction Type with ID ${id} not found`,
      );
    }

    // Convert Date objects to string format for database insertion
    const transactionTypeData = {
      ...updateTypeOperationsDto,
      deferredDate: updateTypeOperationsDto.deferredDate
        ? updateTypeOperationsDto.deferredDate?.toISOString()
        : null,
      dateCanceled: updateTypeOperationsDto.dateCanceled
        ? updateTypeOperationsDto.dateCanceled?.toISOString()
        : null, // Convert dateCanceled to ISO string if it exists
      updatedById: parseInt(userId),
    };

    const result = await this.drizzle
      .update(typeOperations)
      .set({
        ...transactionTypeData,
      })
      .where(eq(typeOperations.id, id))
      .returning({
        id: typeOperations.id,
        code: typeOperations.code,
        description: typeOperations.description,
        deferredDate: typeOperations.deferredDate,
        dateCanceled: typeOperations.dateCanceled,
        deferredNumber: typeOperations.deferredNumber,
        numberCanceled: typeOperations.numberCanceled,
        group: typeOperations.group,
        metadata: typeOperations.metadata,
        associatedAccount: typeOperations.associatedAccount,
        employerAccount: typeOperations.employerAccount,
        loanAccount: typeOperations.loanAccount,
      });

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

    await this.drizzle.delete(typeOperations).where(eq(typeOperations.id, id));

    return { message: 'Transaction Type deleted successfully' };
  }
}
