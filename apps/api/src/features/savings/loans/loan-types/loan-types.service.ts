import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { loanTypes } from '@/database/schema/tables/savings';
import { AuditHelper } from '@/features/audit/audit-event.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateLoanTypeDto } from './dto/loan-types.schema';
import { UpdateLoanTypeDto } from './dto/loan-types.schema';
import { LoanTypePaginationDto } from './dto/pagination-loan-type.dto';

type LoanTypeSelect = typeof loanTypes.$inferSelect;

@Injectable()
export class LoanTypesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private db: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) {}

  async create(
    dto: CreateLoanTypeDto,
    tenantId: string,
    userId: string,
  ): Promise<LoanTypeSelect> {
    const [exists] = await this.db
      .select()
      .from(loanTypes)
      .where(
        and(
          eq(loanTypes.name, dto.name.toUpperCase()),
          eq(loanTypes.tenantId, tenantId),
        ),
      );

    if (exists) {
      throw new BadRequestException(
        `Loan type with name "${dto.name}" already exists`,
      );
    }

    const [created] = await this.db
      .insert(loanTypes)
      .values({
        tenantId,
        name: dto.name.toUpperCase(),
        description: dto.description ?? null,
        interestRate: dto.interestRate.toString(),
        termType: dto.termType,
        termUnits: dto.termUnits,
        cancellationPercentage: dto.cancellationPercentage?.toString() ?? null,
        loanAccountChartId: dto.loanAccountChartId ?? null,
        interestEarnedAccountChartId:
          dto.interestEarnedAccountChartId ?? null,
        specialQuotaAccountChartId: dto.specialQuotaAccountChartId ?? null,
        expenseAccountChartId: dto.expenseAccountChartId ?? null,
        specialQuotaNumber: dto.specialQuotaNumber ?? 0,
        specialQuotaPercentage:
          dto.specialQuotaPercentage?.toString() ?? '0',
        maxLoanAmount: dto.maxLoanAmount?.toString() ?? null,
        minLoanAmount: dto.minLoanAmount?.toString() ?? null,
        payrollTypeId: dto.payrollTypeId ?? null,
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

    await this.auditHelper.logCreate(userId, 'loan_type', created, {
      tenantId,
      targetId: created.id,
      description: `Created loan type ${created.name}`,
    });

    return created;
  }

  async findAllByPagination(
    tenantId: string | null,
    paginationDto?: LoanTypePaginationDto,
  ): Promise<{ data: LoanTypeSelect[]; meta: Record<string, unknown> }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      searchType = '',
      sortBy = 'id',
      sortOrder = 'asc',
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [];

    if (search) {
      switch (searchType) {
        case 'name':
          searchConditions.push(ilike(loanTypes.name, `%${search}%`));
          break;
        case 'description':
          searchConditions.push(ilike(loanTypes.description, `%${search}%`));
          break;
        default:
          searchConditions.push(ilike(loanTypes.name, `%${search}%`));
          break;
      }
    }

    if (tenantId) {
      searchConditions.push(eq(loanTypes.tenantId, tenantId));
    }

    const searchCondition = and(...searchConditions);

    const orderByColumn = loanTypes[sortBy as keyof typeof loanTypes];
    const orderByClause =
      sortOrder === 'asc'
        ? sql`${orderByColumn} asc`
        : sql`${orderByColumn} desc`;

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(loanTypes)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select()
      .from(loanTypes)
      .where(searchCondition)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

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

  async findAll(tenantId: string | null): Promise<LoanTypeSelect[]> {
    const conditions: SQL<unknown>[] = [];

    if (tenantId) {
      conditions.push(eq(loanTypes.tenantId, tenantId));
    }

    return this.db
      .select()
      .from(loanTypes)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${loanTypes.createdAt} desc`);
  }

  async findOne(
    id: string,
    tenantId: string | null,
  ): Promise<LoanTypeSelect> {
    const conditions = [eq(loanTypes.id, id)];

    if (tenantId) {
      conditions.push(eq(loanTypes.tenantId, tenantId));
    }

    const [result] = await this.db
      .select()
      .from(loanTypes)
      .where(and(...conditions));

    if (!result) {
      throw new NotFoundException(`Loan type with ID ${id} not found`);
    }

    return result;
  }

  async update(
    id: string,
    dto: UpdateLoanTypeDto,
    tenantId: string | null,
    userId: string,
  ): Promise<LoanTypeSelect> {
    const existing = await this.findOne(id, tenantId);

    if (dto.name && dto.name.toUpperCase() !== existing.name) {
      const duplicate = await this.db
        .select()
        .from(loanTypes)
        .where(
          and(
            eq(loanTypes.name, dto.name.toUpperCase()),
            eq(loanTypes.tenantId, existing.tenantId),
          ),
        );

      if (duplicate) {
        throw new BadRequestException(
          `Loan type with name "${dto.name}" already exists`,
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updatedById: userId,
    };

    if (dto.name !== undefined) updateData.name = dto.name.toUpperCase();
    if (dto.description !== undefined)
      updateData.description = dto.description;
    if (dto.interestRate !== undefined)
      updateData.interestRate = dto.interestRate.toString();
    if (dto.termType !== undefined) updateData.termType = dto.termType;
    if (dto.termUnits !== undefined) updateData.termUnits = dto.termUnits;
    if (dto.cancellationPercentage !== undefined)
      updateData.cancellationPercentage =
        dto.cancellationPercentage.toString();
    if (dto.loanAccountChartId !== undefined)
      updateData.loanAccountChartId = dto.loanAccountChartId;
    if (dto.interestEarnedAccountChartId !== undefined)
      updateData.interestEarnedAccountChartId =
        dto.interestEarnedAccountChartId;
    if (dto.specialQuotaAccountChartId !== undefined)
      updateData.specialQuotaAccountChartId = dto.specialQuotaAccountChartId;
    if (dto.expenseAccountChartId !== undefined)
      updateData.expenseAccountChartId = dto.expenseAccountChartId;
    if (dto.specialQuotaNumber !== undefined)
      updateData.specialQuotaNumber = dto.specialQuotaNumber;
    if (dto.specialQuotaPercentage !== undefined)
      updateData.specialQuotaPercentage =
        dto.specialQuotaPercentage.toString();
    if (dto.maxLoanAmount !== undefined)
      updateData.maxLoanAmount = dto.maxLoanAmount.toString();
    if (dto.minLoanAmount !== undefined)
      updateData.minLoanAmount = dto.minLoanAmount.toString();
    if (dto.payrollTypeId !== undefined)
      updateData.payrollTypeId = dto.payrollTypeId;
    if (dto.administrativeExpensePercentage !== undefined)
      updateData.administrativeExpensePercentage =
        dto.administrativeExpensePercentage.toString();
    if (dto.minimumSeniorityMonths !== undefined)
      updateData.minimumSeniorityMonths = dto.minimumSeniorityMonths;
    if (dto.acceptsDebitBalance !== undefined)
      updateData.acceptsDebitBalance = dto.acceptsDebitBalance;
    if (dto.acceptsGuarantors !== undefined)
      updateData.acceptsGuarantors = dto.acceptsGuarantors;
    if (dto.acceptsAvailability !== undefined)
      updateData.acceptsAvailability = dto.acceptsAvailability;
    if (dto.acceptsRefinancing !== undefined)
      updateData.acceptsRefinancing = dto.acceptsRefinancing;

    const whereConditions = [eq(loanTypes.id, id)];
    if (tenantId) {
      whereConditions.push(eq(loanTypes.tenantId, tenantId));
    }

    const [updated] = await this.db
      .update(loanTypes)
      .set(updateData)
      .where(and(...whereConditions))
      .returning();

    if (!updated) {
      throw new NotFoundException(
        `Loan type with ID ${id} not found after update`,
      );
    }

    await this.auditHelper.logUpdate(
      userId,
      'loan_type',
      existing,
      updated,
      {
        tenantId: existing.tenantId,
        targetId: updated.id,
        description: `Updated loan type ${updated.name}`,
      },
    );

    return updated;
  }

  async remove(
    id: string,
    tenantId: string | null,
    userId: string,
  ): Promise<void> {
    const existing = await this.findOne(id, tenantId);

    const whereConditions = [eq(loanTypes.id, id)];
    if (tenantId) {
      whereConditions.push(eq(loanTypes.tenantId, tenantId));
    }

    await this.db.delete(loanTypes).where(and(...whereConditions));

    await this.auditHelper.logDelete(userId, 'loan_type', existing, {
      tenantId: existing.tenantId,
      targetId: id,
      description: `Deleted loan type ${existing.name}`,
    });
  }
}
