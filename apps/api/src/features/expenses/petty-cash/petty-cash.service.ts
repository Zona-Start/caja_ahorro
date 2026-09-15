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
  CreatePettyCashFundDto,
  DisbursePettyCashDto,
  FilterPettyCashFundDto,
  ReplenishPettyCashDto,
  UpdatePettyCashFundDto,
} from './dto/petty-cash.schema';

@Injectable()
export class PettyCashService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(tenantId: string) {
    return await this.db
      .select()
      .from(schema.pettyCashFunds)
      .where(
        and(
          eq(schema.pettyCashFunds.tenantId, tenantId),
          eq(schema.pettyCashFunds.isActive, true),
        ),
      );
  }

  async findAllByPagination(tenantId: string, dto?: FilterPettyCashFundDto) {
    const { page = 1, limit = 10, search = '' } = dto || {};
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [
      eq(schema.pettyCashFunds.tenantId, tenantId),
    ];

    if (search) {
      conditions.push(ilike(schema.pettyCashFunds.name, `%${search}%`));
    }

    const whereClause = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.pettyCashFunds)
      .where(whereClause);

    const totalCount = Number(totalResult.count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select()
      .from(schema.pettyCashFunds)
      .where(whereClause)
      .orderBy(sql`${schema.pettyCashFunds.createdAt} desc`)
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
      .from(schema.pettyCashFunds)
      .where(
        and(
          eq(schema.pettyCashFunds.id, id),
          eq(schema.pettyCashFunds.tenantId, tenantId),
        ),
      );

    if (!row) {
      throw new NotFoundException(`Fondo fijo con ID ${id} no encontrado`);
    }

    return row;
  }

  async create(userId: string, tenantId: string, dto: CreatePettyCashFundDto) {
    const result = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(schema.pettyCashFunds)
        .values({
          tenantId,
          name: dto.name,
          custodianUserId: dto.custodianUserId,
          assignedAmount: String(dto.assignedAmount),
          currentBalance: String(dto.assignedAmount),
          currencyCode: dto.currencyCode,
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
        tableName: 'petty_cash_funds',
        recordId: result.id,
        description: `Fondo fijo creado: ${result.name}`,
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
    dto: UpdatePettyCashFundDto,
  ) {
    await this.findOne(id, tenantId);

    const [updated] = await this.db
      .update(schema.pettyCashFunds)
      .set({
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.custodianUserId !== undefined
          ? { custodianUserId: dto.custodianUserId }
          : {}),
        ...(dto.assignedAmount !== undefined
          ? { assignedAmount: String(dto.assignedAmount) }
          : {}),
        ...(dto.currencyCode !== undefined
          ? { currencyCode: dto.currencyCode }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        updatedById: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.pettyCashFunds.id, id),
          eq(schema.pettyCashFunds.tenantId, tenantId),
        ),
      )
      .returning();

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'petty_cash_funds',
        recordId: id,
        description: `Fondo fijo actualizado: ${updated.name}`,
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
      .update(schema.pettyCashFunds)
      .set({ isActive: false, updatedById: userId, updatedAt: new Date() })
      .where(
        and(
          eq(schema.pettyCashFunds.id, id),
          eq(schema.pettyCashFunds.tenantId, tenantId),
        ),
      );

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'DELETE',
        tableName: 'petty_cash_funds',
        recordId: id,
        description: `Fondo fijo desactivado: ${existing.name}`,
        area: 'Expenses',
        previousData: existing,
        tenantId,
      }),
    );

    return { message: 'Fondo fijo desactivado correctamente' };
  }

  async replenish(
    id: string,
    userId: string,
    tenantId: string,
    dto: ReplenishPettyCashDto,
  ) {
    const result = await this.db.transaction(async (tx) => {
      const fund = await this.findOne(id, tenantId);

      const newBalance = Number(fund.currentBalance) + dto.amount;

      const [updated] = await tx
        .update(schema.pettyCashFunds)
        .set({
          currentBalance: String(newBalance),
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(schema.pettyCashFunds.id, id))
        .returning();

      return updated;
    });

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'petty_cash_funds',
        recordId: id,
        description: `Reposición de fondo fijo: ${dto.concept}`,
        area: 'Expenses',
        newData: result,
        tenantId,
      }),
    );

    return result;
  }

  async disburse(
    id: string,
    userId: string,
    tenantId: string,
    dto: DisbursePettyCashDto,
  ) {
    const result = await this.db.transaction(async (tx) => {
      const fund = await this.findOne(id, tenantId);

      if (dto.amount > Number(fund.currentBalance)) {
        throw new BadRequestException(
          'No hay saldo suficiente en el fondo fijo para este desembolso',
        );
      }

      const newBalance = Number(fund.currentBalance) - dto.amount;

      const [updated] = await tx
        .update(schema.pettyCashFunds)
        .set({
          currentBalance: String(newBalance),
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(schema.pettyCashFunds.id, id))
        .returning();

      return updated;
    });

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'petty_cash_funds',
        recordId: id,
        description: `Desembolso de fondo fijo: ${dto.concept}`,
        area: 'Expenses',
        newData: result,
        tenantId,
      }),
    );

    return result;
  }
}
