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
import { and, eq, ilike, sql } from 'drizzle-orm';
import {
  CreateExpenseCategoryDto,
  FilterExpenseCategoryDto,
  UpdateExpenseCategoryDto,
} from './dto/expense-categories.schema';

@Injectable()
export class ExpenseCategoriesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(tenantId: string) {
    return await this.db
      .select()
      .from(schema.expenseCategories)
      .where(
        and(
          eq(schema.expenseCategories.tenantId, tenantId),
          eq(schema.expenseCategories.isActive, true),
        ),
      );
  }

  async findAllByPagination(tenantId: string, dto?: FilterExpenseCategoryDto) {
    const { page = 1, limit = 10, search = '' } = dto || {};
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [
      eq(schema.expenseCategories.tenantId, tenantId),
    ];

    if (search) {
      conditions.push(ilike(schema.expenseCategories.name, `%${search}%`));
    }

    const whereClause = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.expenseCategories)
      .where(whereClause);

    const totalCount = Number(totalResult.count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select()
      .from(schema.expenseCategories)
      .where(whereClause)
      .orderBy(sql`${schema.expenseCategories.createdAt} desc`)
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
      .from(schema.expenseCategories)
      .where(
        and(
          eq(schema.expenseCategories.id, id),
          eq(schema.expenseCategories.tenantId, tenantId),
        ),
      );

    if (!row) {
      throw new NotFoundException(
        `Categoría de gasto con ID ${id} no encontrada`,
      );
    }

    return row;
  }

  async create(
    userId: string,
    tenantId: string,
    dto: CreateExpenseCategoryDto,
  ) {
    const result = await this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(schema.expenseCategories)
        .where(
          and(
            eq(schema.expenseCategories.tenantId, tenantId),
            eq(schema.expenseCategories.name, dto.name),
          ),
        );

      if (existing) {
        throw new BadRequestException(
          `Ya existe una categoría de gasto con el nombre ${dto.name}`,
        );
      }

      const [created] = await tx
        .insert(schema.expenseCategories)
        .values({
          tenantId,
          name: dto.name,
          accountingAccountId: dto.accountingAccountId ?? null,
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
        tableName: 'expense_categories',
        recordId: result.id,
        description: `Categoría de gasto creada: ${result.name}`,
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
    dto: UpdateExpenseCategoryDto,
  ) {
    await this.findOne(id, tenantId);

    const [updated] = await this.db
      .update(schema.expenseCategories)
      .set({
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.accountingAccountId !== undefined
          ? { accountingAccountId: dto.accountingAccountId }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        updatedById: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.expenseCategories.id, id),
          eq(schema.expenseCategories.tenantId, tenantId),
        ),
      )
      .returning();

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'expense_categories',
        recordId: id,
        description: `Categoría de gasto actualizada: ${updated.name}`,
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
      .update(schema.expenseCategories)
      .set({ isActive: false, updatedById: userId, updatedAt: new Date() })
      .where(
        and(
          eq(schema.expenseCategories.id, id),
          eq(schema.expenseCategories.tenantId, tenantId),
        ),
      );

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'DELETE',
        tableName: 'expense_categories',
        recordId: id,
        description: `Categoría de gasto desactivada: ${existing.name}`,
        area: 'Expenses',
        previousData: existing,
        tenantId,
      }),
    );

    return { message: 'Categoría de gasto desactivada correctamente' };
  }
}
