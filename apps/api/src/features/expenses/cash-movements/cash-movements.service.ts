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
import { and, eq, sql } from 'drizzle-orm';
import {
  CreateCashMovementDto,
  FilterCashMovementDto,
} from './dto/cash-movements.schema';

@Injectable()
export class CashMovementsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findBySession(sessionId: string, tenantId: string) {
    const [session] = await this.db
      .select({
        id: schema.cashRegisterSessions.id,
        cashRegisterId: schema.cashRegisterSessions.cashRegisterId,
      })
      .from(schema.cashRegisterSessions)
      .innerJoin(
        schema.cashRegisters,
        eq(schema.cashRegisters.id, schema.cashRegisterSessions.cashRegisterId),
      )
      .where(
        and(
          eq(schema.cashRegisterSessions.id, sessionId),
          eq(schema.cashRegisters.tenantId, tenantId),
        ),
      );

    if (!session) {
      throw new NotFoundException('Sesión de caja no encontrada');
    }

    return await this.db
      .select()
      .from(schema.cashMovements)
      .where(eq(schema.cashMovements.sessionId, sessionId))
      .orderBy(sql`${schema.cashMovements.createdAt} desc`);
  }

  async findAllByPagination(tenantId: string, dto?: FilterCashMovementDto) {
    const { page = 1, limit = 10, sessionId, type } = dto || {};
    const offset = (page - 1) * limit;

    const conditions = [
      eq(schema.cashRegisters.tenantId, tenantId),
      ...(sessionId ? [eq(schema.cashMovements.sessionId, sessionId)] : []),
      ...(type ? [eq(schema.cashMovements.type, type)] : []),
    ];

    const whereClause = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.cashMovements)
      .innerJoin(
        schema.cashRegisterSessions,
        eq(schema.cashRegisterSessions.id, schema.cashMovements.sessionId),
      )
      .innerJoin(
        schema.cashRegisters,
        eq(schema.cashRegisters.id, schema.cashRegisterSessions.cashRegisterId),
      )
      .where(whereClause);

    const totalCount = Number(totalResult.count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select({
        id: schema.cashMovements.id,
        sessionId: schema.cashMovements.sessionId,
        type: schema.cashMovements.type,
        amount: schema.cashMovements.amount,
        concept: schema.cashMovements.concept,
        referenceType: schema.cashMovements.referenceType,
        referenceId: schema.cashMovements.referenceId,
        createdAt: schema.cashMovements.createdAt,
      })
      .from(schema.cashMovements)
      .innerJoin(
        schema.cashRegisterSessions,
        eq(schema.cashRegisterSessions.id, schema.cashMovements.sessionId),
      )
      .innerJoin(
        schema.cashRegisters,
        eq(schema.cashRegisters.id, schema.cashRegisterSessions.cashRegisterId),
      )
      .where(whereClause)
      .orderBy(sql`${schema.cashMovements.createdAt} desc`)
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

  async create(userId: string, tenantId: string, dto: CreateCashMovementDto) {
    const result = await this.db.transaction(async (tx) => {
      const [session] = await tx
        .select()
        .from(schema.cashRegisterSessions)
        .innerJoin(
          schema.cashRegisters,
          eq(
            schema.cashRegisters.id,
            schema.cashRegisterSessions.cashRegisterId,
          ),
        )
        .where(
          and(
            eq(schema.cashRegisterSessions.id, dto.sessionId),
            eq(schema.cashRegisters.tenantId, tenantId),
            eq(schema.cashRegisterSessions.status, 'OPEN'),
          ),
        );

      if (!session) {
        throw new NotFoundException(
          'No existe una sesión de caja abierta para este movimiento',
        );
      }

      const currentBalance = Number(
        (session as any).systemExpectedBalance ?? 0,
      );

      if (dto.type === 'OUTFLOW' && dto.amount > currentBalance) {
        throw new BadRequestException(
          'No hay suficiente saldo esperado en la caja para este egreso',
        );
      }

      const newBalance =
        dto.type === 'INFLOW'
          ? currentBalance + dto.amount
          : currentBalance - dto.amount;

      await tx
        .update(schema.cashRegisterSessions)
        .set({
          systemExpectedBalance: String(newBalance),
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(schema.cashRegisterSessions.id, dto.sessionId));

      const [movement] = await tx
        .insert(schema.cashMovements)
        .values({
          sessionId: dto.sessionId,
          type: dto.type,
          amount: String(dto.amount),
          concept: dto.concept,
          referenceType: dto.referenceType ?? 'MANUAL_ADJUSTMENT',
          createdById: userId,
        })
        .returning();

      return movement;
    });

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'INSERT',
        tableName: 'cash_movements',
        recordId: result.id,
        description: `Movimiento de caja ${result.type}: ${result.concept}`,
        area: 'Expenses',
        newData: result,
        tenantId,
      }),
    );

    return result;
  }
}
