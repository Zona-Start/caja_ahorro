import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { withdrawalTypes } from '@/database/schema/tables/savings';
import { AuditHelper } from '@/features/audit/audit-event.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { WithdrawalTypePaginationDto } from './dto/pagination-withdrawal-type.dto';
import {
  CreateWithdrawalTypeDto,
  UpdateWithdrawalTypeDto,
} from './dto/withdrawal-types.schema';

type WithdrawalTypeSelect = typeof withdrawalTypes.$inferSelect;

@Injectable()
export class WithdrawalTypesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private db: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) {}

  async create(
    dto: CreateWithdrawalTypeDto,
    tenantId: string,
    userId: string,
  ): Promise<{ data: WithdrawalTypeSelect; message: string }> {
    const exists = await this.db
      .select()
      .from(withdrawalTypes)
      .where(
        and(
          eq(withdrawalTypes.description, dto.description),
          eq(withdrawalTypes.tenantId, tenantId),
        ),
      );

    if (exists.length > 0) {
      throw new BadRequestException(
        'Ya existe un tipo de retiro con esa descripción',
      );
    }

    const [created] = await this.db
      .insert(withdrawalTypes)
      .values({
        tenantId,
        description: dto.description,
        withdrawalPercentage: dto.withdrawalPercentage?.toString() ?? null,
        accountDebit: dto.accountDebit ?? null,
        expenseAccount: dto.expenseAccount ?? null,
        administrativeFeePercentage:
          dto.administrativeFeePercentage?.toString() ?? null,
        withdrawalLimitQuantity: dto.withdrawalLimitQuantity ?? null,
        minimumAntiquityDays: dto.minimumAntiquityDays ?? null,
        withdrawalFrequencyRelation: dto.withdrawalFrequencyRelation ?? null,
        isHouseComercial: dto.isHouseComercial ?? false,
        isInternalInventory: dto.isInternalInventory ?? false,
        createdById: userId,
      })
      .returning();

    await this.auditHelper.logCreate(userId, 'withdrawal_type', created, {
      tenantId,
      targetId: created.id,
      description: `Created withdrawal type ${created.description}`,
    });

    return {
      data: created,
      message: 'Tipo de retiro creado exitosamente',
    };
  }

  async findAllByPagination(
    tenantId: string | null,
    paginationDto?: WithdrawalTypePaginationDto,
  ): Promise<{ data: WithdrawalTypeSelect[]; meta: Record<string, unknown> }> {
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
        case 'description':
          searchConditions.push(
            ilike(withdrawalTypes.description, `%${search}%`),
          );
          break;
        default:
          searchConditions.push(
            ilike(withdrawalTypes.description, `%${search}%`),
          );
          break;
      }
    }

    if (tenantId) {
      searchConditions.push(eq(withdrawalTypes.tenantId, tenantId));
    }

    const searchCondition = and(...searchConditions);

    const orderByColumn =
      withdrawalTypes[sortBy as keyof typeof withdrawalTypes];
    const orderByClause =
      sortOrder === 'asc'
        ? sql`${orderByColumn} asc`
        : sql`${orderByColumn} desc`;

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(withdrawalTypes)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select()
      .from(withdrawalTypes)
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

  async findAll(tenantId: string | null): Promise<WithdrawalTypeSelect[]> {
    const conditions: SQL<unknown>[] = [];

    if (tenantId) {
      conditions.push(eq(withdrawalTypes.tenantId, tenantId));
    }

    return this.db
      .select()
      .from(withdrawalTypes)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${withdrawalTypes.createdAt} desc`);
  }

  async findOne(
    id: string,
    tenantId: string | null,
  ): Promise<WithdrawalTypeSelect> {
    const conditions = [eq(withdrawalTypes.id, id)];

    if (tenantId) {
      conditions.push(eq(withdrawalTypes.tenantId, tenantId));
    }

    const [result] = await this.db
      .select()
      .from(withdrawalTypes)
      .where(and(...conditions));

    if (!result) {
      throw new NotFoundException(`WithdrawalType with ID ${id} not found`);
    }

    return result;
  }

  async update(
    id: string,
    dto: UpdateWithdrawalTypeDto,
    tenantId: string | null,
    userId: string,
  ): Promise<WithdrawalTypeSelect> {
    const existing = await this.findOne(id, tenantId);

    if (dto.description && dto.description !== existing.description) {
      const duplicate = await this.db
        .select()
        .from(withdrawalTypes)
        .where(
          and(
            eq(withdrawalTypes.description, dto.description),
            eq(withdrawalTypes.tenantId, existing.tenantId),
          ),
        );

      if (duplicate.length > 0) {
        throw new BadRequestException(
          'Ya existe un tipo de retiro con esa descripción',
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updatedById: userId,
    };

    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.withdrawalPercentage !== undefined)
      updateData.withdrawalPercentage = dto.withdrawalPercentage.toString();
    if (dto.accountDebit !== undefined)
      updateData.accountDebit = dto.accountDebit;
    if (dto.expenseAccount !== undefined)
      updateData.expenseAccount = dto.expenseAccount;
    if (dto.administrativeFeePercentage !== undefined)
      updateData.administrativeFeePercentage =
        dto.administrativeFeePercentage.toString();
    if (dto.withdrawalLimitQuantity !== undefined)
      updateData.withdrawalLimitQuantity = dto.withdrawalLimitQuantity;
    if (dto.minimumAntiquityDays !== undefined)
      updateData.minimumAntiquityDays = dto.minimumAntiquityDays;
    if (dto.withdrawalFrequencyRelation !== undefined)
      updateData.withdrawalFrequencyRelation = dto.withdrawalFrequencyRelation;
    if (dto.isHouseComercial !== undefined)
      updateData.isHouseComercial = dto.isHouseComercial;
    if (dto.isInternalInventory !== undefined)
      updateData.isInternalInventory = dto.isInternalInventory;

    const whereConditions = [eq(withdrawalTypes.id, id)];
    if (tenantId) {
      whereConditions.push(eq(withdrawalTypes.tenantId, tenantId));
    }

    const [updated] = await this.db
      .update(withdrawalTypes)
      .set(updateData)
      .where(and(...whereConditions))
      .returning();

    if (!updated) {
      throw new NotFoundException(
        `WithdrawalType with ID ${id} not found after update`,
      );
    }

    await this.auditHelper.logUpdate(
      userId,
      'withdrawal_type',
      existing,
      updated,
      {
        tenantId: existing.tenantId,
        targetId: updated.id,
        description: `Updated withdrawal type ${updated.description}`,
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

    const whereConditions = [eq(withdrawalTypes.id, id)];
    if (tenantId) {
      whereConditions.push(eq(withdrawalTypes.tenantId, tenantId));
    }

    await this.db.delete(withdrawalTypes).where(and(...whereConditions));

    await this.auditHelper.logDelete(userId, 'withdrawal_type', existing, {
      tenantId: existing.tenantId,
      targetId: id,
      description: `Deleted withdrawal type ${existing.description}`,
    });
  }
}
