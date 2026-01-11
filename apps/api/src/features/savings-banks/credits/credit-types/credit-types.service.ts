import { PaginationDto } from '@/common/dto/pagination.dto';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { creditsTypes as creditsTypesSchema } from '@/database/schema/tables/savings-banks';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateCreditTypeDto } from './dto/create-credit-type.dto';
import { UpdateCreditTypeDto } from './dto/update-credit-type.dto';

@Injectable()
export class CreditTypesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}
  private async findcreditTypeByName(name: string): Promise<boolean> {
    const [creditType] = await this.drizzle
      .select()
      .from(schema.creditsTypes)
      .where(eq(schema.creditsTypes.name, name));

    return !!creditType;
  }

  async create(dto: CreateCreditTypeDto, userId: number) {
    const creditTypeExists = await this.findcreditTypeByName(dto.name);
    if (creditTypeExists) {
      throw new NotFoundException(
        `credit type with name "${dto.name}" already exists`,
      );
    }

    const [creditType] = await this.drizzle
      .insert(creditsTypesSchema)
      .values({
        name: dto.name.toUpperCase(),
        description: dto.description || null,
        interestRate: dto.interestRate.toString(),
        termType: dto.termType,
        termUnits: dto.termUnits,
        cancellationPercentage: dto.cancellationPercentage?.toString() ?? null,
        // creditAccountChartId: dto.creditAccountChartId,
        // interestEarnedAccountChartId: dto.interestEarnedAccountChartId,
        // specialQuotaAccountChartId: dto.specialQuotaAccountChartId || null,
        // expenseAccountChartId: dto.expenseAccountChartId || null,
        specialQuotaNumber: dto.specialQuotaNumber ?? 0,
        specialQuotaPercentage: dto.specialQuotaPercentage?.toString() ?? '0',
        maxCreditAmount: dto.maxCreditAmount?.toString() ?? null,
        minCreditAmount: dto.minCreditAmount?.toString() ?? null,
        payrollTypeId: dto.payrollTypeId || null,
        administrativeExpensePercentage:
          dto.administrativeExpensePercentage?.toString() ?? '0',
        minimumSeniorityMonths: dto.minimumSeniorityMonths ?? 0,
        acceptsDebitBalance: dto.acceptsDebitBalance ?? false,
        acceptsGuarantors: dto.acceptsGuarantors ?? false,
        acceptsAvailability: dto.acceptsAvailability ?? false,
        acceptsRefinancing: dto.acceptsRefinancing ?? false,
        createdById: userId,
      })
      .returning();

    return creditType;
  }

  async findAll() {
    return await this.drizzle.select().from(schema.creditsTypes);
  }

  async findAllByPagination(paginationDto?: PaginationDto) {
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
      searchCondition = ilike(schema.creditsTypes.name, `%${search}%`);
    }

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${schema.creditsTypes[sortBy as keyof typeof schema.creditsTypes]} asc`
        : sql`${schema.creditsTypes[sortBy as keyof typeof schema.creditsTypes]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.creditsTypes)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.drizzle
      .select()
      .from(schema.creditsTypes)
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

    return { data, meta };
  }

  async findOne(id: number) {
    const [creditType] = await this.drizzle
      .select()
      .from(schema.creditsTypes)
      .where(eq(schema.creditsTypes.id, id));

    if (!creditType) {
      throw new NotFoundException(`Credit type with ID ${id} not found`);
    }

    return creditType;
  }

  async update(id: number, dto: UpdateCreditTypeDto, userId: number) {
    const [updatedCreditType] = await this.drizzle
      .update(schema.creditsTypes)
      .set({
        ...dto,
        name: dto.name?.toUpperCase(),
        interestRate: dto.interestRate?.toString(),
        cancellationPercentage: dto.cancellationPercentage?.toString(),
        maxCreditAmount: dto.maxCreditAmount?.toString(),
        minCreditAmount: dto.minCreditAmount?.toString(),
        specialQuotaPercentage: dto.specialQuotaPercentage?.toString(),
        administrativeExpensePercentage:
          dto.administrativeExpensePercentage?.toString(),
        updatedById: userId,
      })
      .where(eq(schema.creditsTypes.id, id))
      .returning();

    if (!updatedCreditType) {
      throw new NotFoundException(`Credit type with ID ${id} not found`);
    }

    return updatedCreditType;
  }
  async remove(id: number) {
    const [deletedCreditType] = await this.drizzle
      .delete(schema.creditsTypes)
      .where(eq(schema.creditsTypes.id, id))
      .returning();

    if (!deletedCreditType) {
      throw new NotFoundException(`Credit type with ID ${id} not found`);
    }

    return deletedCreditType;
  }
}
