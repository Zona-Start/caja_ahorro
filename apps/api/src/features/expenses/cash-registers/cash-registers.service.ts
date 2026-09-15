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
  CreateCashRegisterDto,
  FilterCashRegisterDto,
  UpdateCashRegisterDto,
} from './dto/cash-registers.schema';

@Injectable()
export class CashRegistersService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(tenantId: string) {
    return await this.db
      .select()
      .from(schema.cashRegisters)
      .where(
        and(
          eq(schema.cashRegisters.tenantId, tenantId),
          eq(schema.cashRegisters.isActive, true),
        ),
      );
  }

  async findAllByPagination(tenantId: string, dto?: FilterCashRegisterDto) {
    const { page = 1, limit = 10, search = '', isActive } = dto || {};
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [
      eq(schema.cashRegisters.tenantId, tenantId),
    ];

    if (search) {
      conditions.push(
        or(
          ilike(schema.cashRegisters.name, `%${search}%`),
          ilike(schema.cashRegisters.name, `%${search}%`),
        )!,
      );
    }

    if (isActive) {
      conditions.push(eq(schema.cashRegisters.isActive, isActive === 'ACTIVE'));
    }

    const whereClause = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.cashRegisters)
      .where(whereClause);

    const totalCount = Number(totalResult.count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select()
      .from(schema.cashRegisters)
      .where(whereClause)
      .orderBy(sql`${schema.cashRegisters.createdAt} desc`)
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
      .from(schema.cashRegisters)
      .where(
        and(
          eq(schema.cashRegisters.id, id),
          eq(schema.cashRegisters.tenantId, tenantId),
        ),
      );

    if (!row) {
      throw new NotFoundException(
        `Caja registradora con ID ${id} no encontrada`,
      );
    }

    return row;
  }

  async create(userId: string, tenantId: string, dto: CreateCashRegisterDto) {
    const result = await this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(schema.cashRegisters)
        .where(
          and(
            eq(schema.cashRegisters.tenantId, tenantId),
            eq(schema.cashRegisters.name, dto.name),
          ),
        );

      if (existing) {
        throw new BadRequestException(
          `Ya existe una caja registradora con el nombre ${dto.name}`,
        );
      }

      const [created] = await tx
        .insert(schema.cashRegisters)
        .values({
          tenantId,
          name: dto.name,
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
        tableName: 'cash_registers',
        recordId: result.id,
        description: `Caja registradora creada: ${result.name}`,
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
    dto: UpdateCashRegisterDto,
  ) {
    await this.findOne(id, tenantId);

    const [updated] = await this.db
      .update(schema.cashRegisters)
      .set({
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        updatedById: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.cashRegisters.id, id),
          eq(schema.cashRegisters.tenantId, tenantId),
        ),
      )
      .returning();

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'cash_registers',
        recordId: id,
        description: `Caja registradora actualizada: ${updated.name}`,
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
      .update(schema.cashRegisters)
      .set({ isActive: false, updatedById: userId, updatedAt: new Date() })
      .where(
        and(
          eq(schema.cashRegisters.id, id),
          eq(schema.cashRegisters.tenantId, tenantId),
        ),
      );

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'DELETE',
        tableName: 'cash_registers',
        recordId: id,
        description: `Caja registradora desactivada: ${existing.name}`,
        area: 'Expenses',
        previousData: existing,
        tenantId,
      }),
    );

    return { message: 'Caja registradora desactivada correctamente' };
  }
}
