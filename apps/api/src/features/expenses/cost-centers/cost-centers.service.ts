import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, eq, ilike, or, sql } from 'drizzle-orm';
import {
  CreateCostCenterDto,
  FilterCostCenterDto,
  UpdateCostCenterDto,
} from './dto/cost-centers.schema';

@Injectable()
export class CostCentersService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(tenantId: string) {
    return await this.db
      .select()
      .from(schema.costCenters)
      .where(
        and(
          eq(schema.costCenters.tenantId, tenantId),
          eq(schema.costCenters.isActive, true),
        ),
      );
  }

  async findAllByPagination(tenantId: string, dto?: FilterCostCenterDto) {
    const { page = 1, limit = 10, search = '' } = dto || {};
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [
      eq(schema.costCenters.tenantId, tenantId),
    ];

    if (search) {
      conditions.push(
        or(
          ilike(schema.costCenters.name, `%${search}%`),
          ilike(schema.costCenters.code, `%${search}%`),
        )!,
      );
    }

    const whereClause = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.costCenters)
      .where(whereClause);

    const totalCount = Number(totalResult.count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select()
      .from(schema.costCenters)
      .where(whereClause)
      .orderBy(sql`${schema.costCenters.createdAt} desc`)
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const [row] = await this.db
      .select()
      .from(schema.costCenters)
      .where(
        and(
          eq(schema.costCenters.id, id),
          eq(schema.costCenters.tenantId, tenantId),
        ),
      );

    if (!row) {
      throw new NotFoundException(`Centro de costo con ID ${id} no encontrado`);
    }

    return row;
  }

  async getBudgetUsage(tenantId: string, id: string, month?: string) {
    const center = await this.findOne(id, tenantId);

    const period = month ?? new Date().toISOString().slice(0, 7);

    const [totalResult] = await this.db
      .select({
        total: sql<number>`COALESCE(SUM(${schema.expenses.amountBase}), 0)`,
      })
      .from(schema.expenses)
      .where(
        and(
          eq(schema.expenses.costCenterId, id),
          eq(schema.expenses.tenantId, tenantId),
          sql`TO_CHAR(${schema.expenses.createdAt}, 'YYYY-MM') = ${period}`,
        ),
      );

    const used = Number(totalResult?.total ?? 0);
    const budget = center.monthlyBudget ? Number(center.monthlyBudget) : null;

    return {
      costCenterId: id,
      period,
      used,
      budget,
      remaining: budget !== null ? budget - used : null,
      percentage: budget ? Math.round((used / budget) * 100) : null,
    };
  }

  async create(userId: string, tenantId: string, dto: CreateCostCenterDto) {
    const result = await this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(schema.costCenters)
        .where(
          and(
            eq(schema.costCenters.tenantId, tenantId),
            eq(schema.costCenters.code, dto.code),
          ),
        );

      if (existing) {
        throw new BadRequestException(
          `Ya existe un centro de costo con el código ${dto.code}`,
        );
      }

      const [created] = await tx
        .insert(schema.costCenters)
        .values({
          tenantId,
          code: dto.code,
          name: dto.name,
          monthlyBudget:
            dto.monthlyBudget !== undefined ? String(dto.monthlyBudget) : null,
          isActive: dto.isActive ?? true,
          createdById: userId,
        })
        .returning();

      return created;
    });

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'INSERT',
        tableName: 'cost_centers',
        recordId: result.id,
        description: `Centro de costo creado: ${result.name} (${result.code})`,
        area: 'Expenses',
        newData: result,
        tenantId,
      }),
    );

    return result;
  }

  async update(
    id: string,
    userId: string,
    tenantId: string,
    dto: UpdateCostCenterDto,
  ) {
    await this.findOne(id, tenantId);

    const [updated] = await this.db
      .update(schema.costCenters)
      .set({
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.monthlyBudget !== undefined
          ? { monthlyBudget: String(dto.monthlyBudget) }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        updatedById: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.costCenters.id, id),
          eq(schema.costCenters.tenantId, tenantId),
        ),
      )
      .returning();

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'cost_centers',
        recordId: id,
        description: `Centro de costo actualizado: ${updated.name}`,
        area: 'Expenses',
        newData: updated,
        tenantId,
      }),
    );

    return updated;
  }

  async remove(id: string, userId: string, tenantId: string) {
    const existing = await this.findOne(id, tenantId);

    await this.db
      .update(schema.costCenters)
      .set({ isActive: false, updatedById: userId, updatedAt: new Date() })
      .where(
        and(
          eq(schema.costCenters.id, id),
          eq(schema.costCenters.tenantId, tenantId),
        ),
      );

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'DELETE',
        tableName: 'cost_centers',
        recordId: id,
        description: `Centro de costo desactivado: ${existing.name}`,
        area: 'Expenses',
        previousData: existing,
        tenantId,
      }),
    );

    return { message: 'Centro de costo desactivado correctamente' };
  }
}
