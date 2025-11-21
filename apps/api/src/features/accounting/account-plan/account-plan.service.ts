import { accountPlan } from '@/database/schema/tables';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import { ActionEnumAudit } from '@/types/enum';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { UpdateAccountPlanDto } from './dto//update-account-plan.dto';
import { CreateAccountPlanDto } from './dto/create-account-plan.dto';
import { FilterAccountPlanDto } from './dto/filter-account-plan.dto';
import { AccountPlan } from './entities/account-plan.entity';

@Injectable()
export class AccountPlanService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAccountPlanByCode(code: string) {
    return this.drizzle
      .select()
      .from(accountPlan)
      .where(eq(accountPlan.code, code));
  }

  async create(userdId: number, createAccountPlanDto: CreateAccountPlanDto) {
    const existsAccountPlan = await this.drizzle
      .select()
      .from(accountPlan)
      .where(
        and(
          eq(accountPlan.code, createAccountPlanDto.code),
          eq(accountPlan.level, createAccountPlanDto.level),
        ),
      ); // Check if account plan already exists in the databas

    if (existsAccountPlan.length !== 0) {
      throw new NotFoundException(`Account Plan already exists`);
    }
    const result = await this.drizzle
      .insert({
        ...accountPlan,
        createdById: userdId,
      })
      .values(createAccountPlanDto)
      .returning();

    // Registra el log auditoria
    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        tableName: 'accountPlan',
        recordId: String(result[0].id),
        action: ActionEnumAudit.INSERT,
        userId: Number(userdId),
        area: 'CONTABLE',
        description: 'Creación de Plan de Cuenta',
        newData: [result[0]],
      }),
    );

    return result[0];
  }

  async findAll() {
    return await this.drizzle.select().from(accountPlan);
    //.where(eq(accountPlan.allowsMovements, true));
  }

  async findAllByPagination(
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

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build search condition
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

    if (type) {
      searchConditions.push(eq(accountPlan.accountType, type));
    }

    if (level) {
      searchConditions.push(eq(accountPlan.level, Number(level)));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${accountPlan[sortBy as keyof typeof accountPlan]} asc`
        : sql`${accountPlan[sortBy as keyof typeof accountPlan]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(accountPlan)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.drizzle
      .select({
        id: accountPlan.id,
        companyId: accountPlan.companyId,
        code: accountPlan.code,
        name: accountPlan.name,
        description: accountPlan.description,
        accountType: accountPlan.accountType,
        nature: accountPlan.nature,
        level: accountPlan.level,
        allowsMovements: accountPlan.allowsMovements,
        isActive: accountPlan.isActive,
        parentAccountId: accountPlan.parentAccountId,
      })
      .from(accountPlan)
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
      data: data as AccountPlan[],
      meta,
    };
  }

  async findOne(id: number) {
    const result = await this.drizzle
      .select()
      .from(accountPlan)
      .where(eq(accountPlan.id, id));

    if (!result.length) {
      throw new NotFoundException(`Account Plan with ID ${id} not found`);
    }

    return result[0];
  }

  async update(
    userdId: number,
    id: number,
    updateAccountPlanDto: UpdateAccountPlanDto,
  ) {
    const existingAccountPlan = await this.findOne(id);

    if (!existingAccountPlan) {
      throw new NotFoundException(
        `Update Account Plan with ID ${id} not found`,
      );
    }

    const result = await this.drizzle
      .update(accountPlan)
      .set({
        ...updateAccountPlanDto,
        updatedById: userdId,
      })
      .where(eq(accountPlan.id, id))
      .returning();

    // Registra el log auditoria
    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        tableName: 'accountPlan',
        recordId: String(result[0].id),
        action: ActionEnumAudit.UPDATE,
        userId: Number(userdId),
        area: 'CONTABLE',
        description: 'Actualizacion de Plan de Cuenta',
        newData: [result[0]],
      }),
    );

    return result[0];
  }

  async remove(id: number, userdId: number) {
    const existingAccountPlan = await this.findOne(id);
    if (!existingAccountPlan) {
      throw new NotFoundException(
        `Delete Account Plan with ID ${id} not found`,
      );
    }

    await this.drizzle.delete(accountPlan).where(eq(accountPlan.id, id));

    // Registra el log auditoria
    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        tableName: 'accountPlan',
        recordId: String(id),
        action: ActionEnumAudit.DELETE,
        userId: Number(userdId),
        area: 'CONTABLE',
        description: 'Eliminacion de Plan de Cuenta',
        newData: [id],
      }),
    );

    return { message: 'Account Plan deleted successfully' };
  }
}
