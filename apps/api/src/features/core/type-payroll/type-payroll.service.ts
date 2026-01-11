import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { typePayrolls } from 'src/database/index';
import { CreateTypePayrollDto } from './dto/create-type-payroll.dto';
import { FilterTypePayrollDto } from './dto/filter-type-payroll.dto';
import { UpdateTypePayrollDto } from './dto/update-type-payroll.dto';
import { TypePayrolls } from './entities/type-payroll.entity';

@Injectable()
export class TypePayrollService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findTransactionTypeByCode(code: string) {
    return this.drizzle
      .select()
      .from(typePayrolls)
      .where(eq(typePayrolls.code, code));
  }

  async create(userId: string, data: CreateTypePayrollDto) {
    const find = await this.findTransactionTypeByCode(data.code);
    if (find.length !== 0) {
      throw new NotFoundException(`Transaction Type already exists`);
    }

    // Convert Date objects to string format for database insertion
    const transactionTypeData = {
      ...data,
      deferredDate: data.deferredDate ? data.deferredDate.toISOString() : null,
      dateCanceled: data.dateCanceled ? data.dateCanceled?.toISOString() : null, // Convert dateCanceled to ISO string if it exists
      createdById: parseInt(userId),
    };

    const transaction = await this.drizzle
      .insert(typePayrolls)
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
        id: typePayrolls.id,
        code: typePayrolls.code,
        description: typePayrolls.description,
        deferredDate: typePayrolls.deferredDate,
        dateCanceled: typePayrolls.dateCanceled,
        deferredNumber: typePayrolls.deferredNumber,
        numberCanceled: typePayrolls.numberCanceled,
        group: typePayrolls.group,
        metadata: typePayrolls.metadata,
        // associatedAccount: typePayrolls.associatedAccount,
        // employerAccount: typePayrolls.employerAccount,
        // loanAccount: typePayrolls.loanAccount,
      })
      .from(typePayrolls);
  }

  findOne(id: number) {
    return this.drizzle
      .select({
        id: typePayrolls.id,
        code: typePayrolls.code,
        description: typePayrolls.description,
        deferredDate: typePayrolls.deferredDate,
        dateCanceled: typePayrolls.dateCanceled,
        deferredNumber: typePayrolls.deferredNumber,
        numberCanceled: typePayrolls.numberCanceled,
        group: typePayrolls.group,
        metadata: typePayrolls.metadata,
        // associatedAccount: typePayrolls.associatedAccount,
        // employerAccount: typePayrolls.employerAccount,
        // loanAccount: typePayrolls.loanAccount,
      })
      .from(typePayrolls)
      .where(eq(typePayrolls.id, id));
  }

  async findAllByPagination(
    filterTypePayrollDto?: FilterTypePayrollDto,
  ): Promise<{ data: TypePayrolls[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      group = '',
    } = filterTypePayrollDto || {};

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build search condition
    let searchCondition: SQL<unknown> | undefined;
    if (search) {
      searchCondition = ilike(typePayrolls.description, `%${search}%`);
    }

    // Agregué una condición para filtrar por grupo si el parámetro `group` está presente.
    if (group) {
      searchCondition = searchCondition
        ? sql`${searchCondition} AND ${typePayrolls.group} = ${group}`
        : sql`${typePayrolls.group} = ${group}`;
    }

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${typePayrolls[sortBy as keyof typeof typePayrolls]} asc`
        : sql`${typePayrolls[sortBy as keyof typeof typePayrolls]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(typePayrolls)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.drizzle
      .select({
        id: typePayrolls.id,
        code: typePayrolls.code,
        description: typePayrolls.description,
        deferredDate: typePayrolls.deferredDate,
        dateCanceled: typePayrolls.dateCanceled,
        deferredNumber: typePayrolls.deferredNumber,
        numberCanceled: typePayrolls.numberCanceled,
        group: typePayrolls.group,
        metadata: typePayrolls.metadata,
        // associatedAccount: typePayrolls.associatedAccount,
        // employerAccount: typePayrolls.employerAccount,
        // loanAccount: typePayrolls.loanAccount,
      })
      .from(typePayrolls)
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

  async update(id: number, userId: string, data: UpdateTypePayrollDto) {
    const existingTransactionType = await this.findOne(id);

    if (existingTransactionType.length === 0) {
      throw new NotFoundException(
        `Update Transaction Type with ID ${id} not found`,
      );
    }

    // Convert Date objects to string format for database insertion
    const transactionTypeData = {
      ...data,
      deferredDate: data.deferredDate ? data.deferredDate?.toISOString() : null,
      dateCanceled: data.dateCanceled ? data.dateCanceled?.toISOString() : null, // Convert dateCanceled to ISO string if it exists
      updatedById: parseInt(userId),
    };

    const result = await this.drizzle
      .update(typePayrolls)
      .set({
        ...transactionTypeData,
      })
      .where(eq(typePayrolls.id, id))
      .returning({
        id: typePayrolls.id,
        code: typePayrolls.code,
        description: typePayrolls.description,
        deferredDate: typePayrolls.deferredDate,
        dateCanceled: typePayrolls.dateCanceled,
        deferredNumber: typePayrolls.deferredNumber,
        numberCanceled: typePayrolls.numberCanceled,
        group: typePayrolls.group,
        metadata: typePayrolls.metadata,
        // associatedAccount: typePayrolls.associatedAccount,
        // employerAccount: typePayrolls.employerAccount,
        // loanAccount: typePayrolls.loanAccount,
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

    await this.drizzle.delete(typePayrolls).where(eq(typePayrolls.id, id));

    return { message: 'Transaction Type deleted successfully' };
  }
}
