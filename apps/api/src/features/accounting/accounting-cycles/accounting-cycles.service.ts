import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { CreateAccountingCycleDto } from './dto/create-accounting-cycle.dto';
import { FilterAccountingCycleDto } from './dto/filter-accounting-cycle.dto';
import { UpdateAccountingCycleDto } from './dto/update-accounting-cycle.dto';
import { AccountingCycle } from './entities/accounting-cycle.entity';

@Injectable()
export class AccountingCyclesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  private async getAccountingCycleForDate(startDate: Date, endDate: Date) {
    const existingCycle = await this.drizzle
      .select()
      .from(schema.accountingCycles)
      .where(
        and(
          eq(
            schema.accountingCycles.startDate,
            startDate.toISOString().split('T')[0],
          ),
          eq(
            schema.accountingCycles.endDate,
            endDate.toISOString().split('T')[0],
          ),
        ),
      );

    return existingCycle;
  }

  async create(
    userdId: number,
    createAccountingCycleDto: CreateAccountingCycleDto,
  ): Promise<AccountingCycle> {
    const existingCycle = await this.getAccountingCycleForDate(
      createAccountingCycleDto.startDate,
      createAccountingCycleDto.endDate,
    );
    if (existingCycle[0]?.status === 'OPEN') {
      throw new NotFoundException(`There is an open accounting cycle`);
    }

    const newCycle = await this.drizzle
      .insert(schema.accountingCycles)
      .values({
        companyId: createAccountingCycleDto.companyId,
        startDate: createAccountingCycleDto.startDate
          .toISOString()
          .split('T')[0],
        endDate: createAccountingCycleDto.endDate.toISOString().split('T')[0],
        status: 'OPEN',
        description: createAccountingCycleDto.description,
        createdById: userdId,
      })
      .returning();
    return {
      ...newCycle[0],
      startDate: new Date(newCycle[0].startDate),
      endDate: new Date(newCycle[0].endDate),
    } as AccountingCycle;
  }

  async findAll() {
    return await this.drizzle.select().from(schema.accountingCycles);
  }

  async findAllPaginated(
    paginationDto?: FilterAccountingCycleDto,
  ): Promise<{ data: AccountingCycle[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      startDate = '',
      endDate = '',
      status = '',
    } = paginationDto || {};
    // Calculate offset
    const offset = (page - 1) * limit;

    // Build search condition
    let searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(
        ilike(schema.accountingCycles.description, `%${search}%`),
      );
    }

    if (startDate) {
      searchConditions.push(
        eq(
          schema.accountingCycles.startDate,
          startDate.toISOString().split('T')[0],
        ),
      );
    }

    if (endDate) {
      searchConditions.push(
        eq(
          schema.accountingCycles.endDate,
          endDate.toISOString().split('T')[0],
        ),
      );
    }

    if (status) {
      searchConditions.push(eq(schema.accountingCycles.status, status));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${schema.accountingCycles[sortBy as keyof typeof schema.accountingCycles]} asc`
        : sql`${schema.accountingCycles[sortBy as keyof typeof schema.accountingCycles]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.accountingCycles)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.drizzle
      .select({
        id: schema.accountingCycles.id,
        companyId: schema.accountingCycles.companyId,
        startDate: schema.accountingCycles.startDate,
        endDate: schema.accountingCycles.endDate,
        status: schema.accountingCycles.status,
        description: schema.accountingCycles.description,
        closedAt: schema.accountingCycles.closedAt,
      })
      .from(schema.accountingCycles)
      .where(searchCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

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

    return {
      data: data.map((cycle) => ({
        ...cycle,
        startDate: new Date(cycle.startDate),
        endDate: new Date(cycle.endDate),
      })) as AccountingCycle[],
      meta,
    };
  }

  async findOne(id: number) {
    const result = await this.drizzle
      .select()
      .from(schema.accountingCycles)
      .where(eq(schema.accountingCycles.id, id));

    if (!result.length) {
      throw new NotFoundException(`Accounting Cycle with ID ${id} not found`);
    }

    return result[0];
  }

  async update(
    userId: number,
    id: number,
    updateAccountingCycleDto: UpdateAccountingCycleDto,
  ) {
    const existingAccountPlan = await this.findOne(id);

    if (!existingAccountPlan) {
      throw new NotFoundException(
        `Update Account Plan with ID ${id} not found`,
      );
    }

    const result = await this.drizzle
      .update(schema.accountingCycles)
      .set({
        companyId: updateAccountingCycleDto.companyId,
        startDate: updateAccountingCycleDto?.startDate
          ?.toISOString()
          .split('T')[0],
        endDate: updateAccountingCycleDto?.endDate?.toISOString().split('T')[0],
        status: updateAccountingCycleDto.status,
        description: updateAccountingCycleDto.description,
        updatedById: userId,
      })
      .where(eq(schema.accountingCycles.id, id))
      .returning();

    return result[0];
  }

  async close(userId: number, id: number) {
    const existingAccountPlan = await this.findOne(id);

    if (!existingAccountPlan) {
      throw new NotFoundException(
        `Update Account Plan with ID ${id} not found`,
      );
    }

    const result = await this.drizzle
      .update(schema.accountingCycles)
      .set({
        closedByUser_id: userId,
        updatedById: userId,
        closedAt: new Date(),
        status: 'CLOSED',
      })
      .where(eq(schema.accountingCycles.id, id))
      .returning();
    return result[0];
  }
}
