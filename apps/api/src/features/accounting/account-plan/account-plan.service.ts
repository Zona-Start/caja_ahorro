import { accountPlan } from '@/database/schema';
import { AccountPlan } from '@/database/types/accounting';
import { AuditHelper } from '@/features/audit/audit-event.service';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/schema';
import { UpdateAccountPlanDto } from './dto//update-account-plan.dto';
import { CreateAccountPlanDto } from './dto/create-account-plan.dto';
import { FilterAccountPlanDto } from './dto/filter-account-plan.dto';

@Injectable()
export class AccountPlanService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) {}

  async findAccountPlanByCode(code: string) {
    return this.drizzle
      .select()
      .from(accountPlan)
      .where(eq(accountPlan.code, code));
  }

  async create(
    createAccountPlanDto: CreateAccountPlanDto,
    tenantId: string,
    userId: string,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const existsAccountPlan = await tx
        .select()
        .from(accountPlan)
        .where(
          and(
            eq(accountPlan.code, createAccountPlanDto.code),
            eq(accountPlan.tenantId, tenantId),
          ),
        );

      if (existsAccountPlan.length !== 0) {
        throw new NotFoundException(`Account Plan already exists`);
      }
      const result = await tx
        .insert(accountPlan)
        .values({
          tenantId: tenantId,
          code: createAccountPlanDto.code,
          name: createAccountPlanDto.name,
          description: createAccountPlanDto.description,
          accountType: createAccountPlanDto.accountType,
          nature: createAccountPlanDto.nature,
          level: createAccountPlanDto.level,
          allowsMovements: createAccountPlanDto.allowsMovements,
          isActive: createAccountPlanDto.isActive,
          parentAccountId: createAccountPlanDto.parentAccountId,
          createdById: userId,
        })
        .returning();

      // Registra el log auditoria
      await this.auditHelper.logCreate(tenantId, 'accountPlan', result[0], {
        targetId: result[0].id,
        description: `Created Account Plan ${result[0].name}`,
      });

      return result[0];
    });
  }

  async findAll(tenantId: string) {
    return await this.drizzle
      .select()
      .from(accountPlan)
      .where(eq(accountPlan.tenantId, tenantId));
  }

  async findAllByPagination(
    tenantId: string | null, // Ahora puede ser null si es superadmin
    paginationDto?: FilterAccountPlanDto,
  ): Promise<{ data: AccountPlan[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      searchType = '',
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      type = '',
      level = '',
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];

    if (search) {
      switch (searchType) {
        case 'code':
          searchConditions.push(ilike(accountPlan.code, `%${search}%`));
          break;
        case 'name':
          searchConditions.push(ilike(accountPlan.name, `%${search}%`));
          break;
      }
    }

    if (tenantId) {
      searchConditions.push(eq(accountPlan.tenantId, tenantId));
    }

    if (type) {
      searchConditions.push(eq(accountPlan.accountType, type as any));
    }

    if (level) {
      searchConditions.push(eq(accountPlan.level, Number(level)));
    }

    const searchCondition = and(...searchConditions);

    const orderBy =
      sortOrder === 'asc'
        ? sql`${accountPlan[sortBy as keyof typeof accountPlan]} asc`
        : sql`${accountPlan[sortBy as keyof typeof accountPlan]} desc`;

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(accountPlan)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.drizzle
      .select()
      .from(accountPlan)
      .where(searchCondition)
      .orderBy(orderBy)
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

    return {
      data: data as AccountPlan[],
      meta,
    };
  }

  async findOne(
    tenantId: string,
    id: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;
    const result = await db
      .select()
      .from(accountPlan)
      .where(and(eq(accountPlan.id, id), eq(accountPlan.tenantId, tenantId)));

    if (!result.length) {
      throw new NotFoundException(`Account Plan with ID ${id} not found`);
    }

    return result[0];
  }

  async update(
    id: string,
    tenantId: string,
    userId: string,
    updateAccountPlanDto: UpdateAccountPlanDto,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const existingAccountPlan = await this.findOne(tenantId, id, tx);

      const result = await tx
        .update(accountPlan)
        .set({
          ...updateAccountPlanDto,
          updatedById: userId,
        })
        .where(and(eq(accountPlan.id, id), eq(accountPlan.tenantId, tenantId)))
        .returning();

      await this.auditHelper.logUpdate(
        tenantId,
        'accountPlan',
        existingAccountPlan,
        result[0],
        { targetId: id, description: `Updated Account Plan ${result[0].name}` },
      );

      return result[0];
    });
  }

  async remove(id: string, tenantId: string, userId: string) {
    const existingAccountPlan = await this.findOne(tenantId, id);

    await this.drizzle
      .delete(accountPlan)
      .where(and(eq(accountPlan.id, id), eq(accountPlan.tenantId, tenantId)));

    await this.auditHelper.logDelete(
      tenantId,
      'accountPlan',
      existingAccountPlan,
      {
        targetId: id,
        description: `Deleted Account Plan ${existingAccountPlan.name}`,
      },
    );

    return { message: 'Account Plan deleted successfully' };
  }
}
