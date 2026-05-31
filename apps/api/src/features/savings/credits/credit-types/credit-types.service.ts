import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { creditsTypes } from '@/database/schema/tables/savings';
import { AuditHelper } from '@/features/audit/audit-event.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateCreditTypeDto } from './dto/credit-types.schema';
import { UpdateCreditTypeDto } from './dto/credit-types.schema';
import { CreditTypePaginationDto } from './dto/pagination-credit-type.dto';

type CreditTypeSelect = typeof creditsTypes.$inferSelect;

@Injectable()
export class CreditTypesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private db: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) { }

  async create(
    dto: CreateCreditTypeDto,
    tenantId: string,
    userId: string,
  ): Promise<CreditTypeSelect> {
    const [exists] = await this.db
      .select()
      .from(creditsTypes)
      .where(
        and(
          eq(creditsTypes.name, dto.name.toUpperCase()),
          eq(creditsTypes.tenantId, tenantId),
        ),
      );

    if (exists) {
      throw new BadRequestException(
        `Credit type with name "${dto.name}" already exists`,
      );
    }

    const [created] = await this.db
      .insert(creditsTypes)
      .values({
        tenantId,
        name: dto.name.toUpperCase(),
        description: dto.description ?? null,
        interestRate: dto.interestRate.toString(),
        termType: dto.termType,
        termUnits: dto.termUnits,
        cancellationPercentage: dto.cancellationPercentage?.toString() ?? null,
        creditAccountChartId: dto.creditAccountChartId ?? null,
        interestEarnedAccountChartId:
          dto.interestEarnedAccountChartId ?? null,
        specialQuotaAccountChartId: dto.specialQuotaAccountChartId ?? null,
        expenseAccountChartId: dto.expenseAccountChartId ?? null,
        specialQuotaNumber: dto.specialQuotaNumber ?? 0,
        specialQuotaPercentage:
          dto.specialQuotaPercentage?.toString() ?? '0',
        maxCreditAmount: dto.maxCreditAmount?.toString() ?? null,
        minCreditAmount: dto.minCreditAmount?.toString() ?? null,
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

    await this.auditHelper.logCreate(userId, 'credit_type', created, {
      tenantId,
      targetId: created.id,
      description: `Created credit type ${created.name}`,
    });

    return created;
  }

  async findAllByPagination(
    tenantId: string | null,
    paginationDto?: CreditTypePaginationDto,
  ): Promise<{ data: CreditTypeSelect[]; meta: Record<string, unknown> }> {
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
          searchConditions.push(ilike(creditsTypes.name, `%${search}%`));
          break;
        case 'description':
          searchConditions.push(
            ilike(creditsTypes.description, `%${search}%`),
          );
          break;
        default:
          searchConditions.push(ilike(creditsTypes.name, `%${search}%`));
          break;
      }
    }

    if (tenantId) {
      searchConditions.push(eq(creditsTypes.tenantId, tenantId));
    }

    const searchCondition = and(...searchConditions);

    const orderByColumn = creditsTypes[sortBy as keyof typeof creditsTypes];
    const orderByClause =
      sortOrder === 'asc'
        ? sql`${orderByColumn} asc`
        : sql`${orderByColumn} desc`;

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(creditsTypes)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select()
      .from(creditsTypes)
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

  async findAll(tenantId: string | null): Promise<CreditTypeSelect[]> {
    const conditions: SQL<unknown>[] = [];

    if (tenantId) {
      conditions.push(eq(creditsTypes.tenantId, tenantId));
    }

    return this.db
      .select()
      .from(creditsTypes)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${creditsTypes.createdAt} desc`);
  }

  async findOne(
    id: string,
    tenantId: string | null,
  ): Promise<CreditTypeSelect> {
    const conditions = [eq(creditsTypes.id, id)];

    if (tenantId) {
      conditions.push(eq(creditsTypes.tenantId, tenantId));
    }

    const [result] = await this.db
      .select()
      .from(creditsTypes)
      .where(and(...conditions));

    if (!result) {
      throw new NotFoundException(`Credit type with ID ${id} not found`);
    }

    return result;
  }

  async update(
    id: string,
    dto: UpdateCreditTypeDto,
    tenantId: string | null,
    userId: string,
  ): Promise<CreditTypeSelect> {
    const existing = await this.findOne(id, tenantId);


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
    if (dto.creditAccountChartId !== undefined)
      updateData.creditAccountChartId = dto.creditAccountChartId;
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
    if (dto.maxCreditAmount !== undefined)
      updateData.maxCreditAmount = dto.maxCreditAmount.toString();
    if (dto.minCreditAmount !== undefined)
      updateData.minCreditAmount = dto.minCreditAmount.toString();
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

    const whereConditions = [eq(creditsTypes.id, id)];
    if (tenantId) {
      whereConditions.push(eq(creditsTypes.tenantId, tenantId));
    }

    const [updated] = await this.db
      .update(creditsTypes)
      .set(updateData)
      .where(and(...whereConditions))
      .returning();

    if (!updated) {
      throw new NotFoundException(
        `Credit type with ID ${id} not found after update`,
      );
    }

    await this.auditHelper.logUpdate(
      userId,
      'credit_type',
      existing,
      updated,
      {
        tenantId: existing.tenantId,
        targetId: updated.id,
        description: `Updated credit type ${updated.name}`,
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

    const whereConditions = [eq(creditsTypes.id, id)];
    if (tenantId) {
      whereConditions.push(eq(creditsTypes.tenantId, tenantId));
    }

    await this.db.delete(creditsTypes).where(and(...whereConditions));

    await this.auditHelper.logDelete(userId, 'credit_type', existing, {
      tenantId: existing.tenantId,
      targetId: id,
      description: `Deleted credit type ${existing.name}`,
    });
  }
}
