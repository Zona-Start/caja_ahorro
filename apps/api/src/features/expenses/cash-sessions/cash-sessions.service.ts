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
  CloseCashSessionDto,
  FilterCashSessionDto,
  OpenCashSessionDto,
} from './dto/cash-sessions.schema';

@Injectable()
export class CashSessionsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findActive(tenantId: string, cashRegisterId: string) {
    const [session] = await this.db
      .select()
      .from(schema.cashRegisterSessions)
      .where(
        and(
          eq(schema.cashRegisterSessions.cashRegisterId, cashRegisterId),
          eq(schema.cashRegisterSessions.status, 'OPEN'),
        ),
      );

    if (!session) {
      throw new NotFoundException(
        'No existe una sesión de caja abierta para esta caja registradora',
      );
    }

    return session;
  }

  async findActiveByRegister(tenantId: string, cashRegisterId: string) {
    const [register] = await this.db
      .select({
        id: schema.cashRegisters.id,
        name: schema.cashRegisters.name,
      })
      .from(schema.cashRegisters)
      .where(
        and(
          eq(schema.cashRegisters.id, cashRegisterId),
          eq(schema.cashRegisters.tenantId, tenantId),
          eq(schema.cashRegisters.isActive, true),
        ),
      );

    if (!register) {
      throw new NotFoundException('Caja registradora no encontrada');
    }

    const [session] = await this.db
      .select()
      .from(schema.cashRegisterSessions)
      .where(
        and(
          eq(schema.cashRegisterSessions.cashRegisterId, cashRegisterId),
          eq(schema.cashRegisterSessions.status, 'OPEN'),
        ),
      );

    return { register, session: session ?? null };
  }

  async findAllByPagination(tenantId: string, dto?: FilterCashSessionDto) {
    const { page = 1, limit = 10, cashRegisterId, status } = dto || {};
    const offset = (page - 1) * limit;

    const conditions = [
      eq(schema.cashRegisters.tenantId, tenantId),
      ...(cashRegisterId
        ? [eq(schema.cashRegisterSessions.cashRegisterId, cashRegisterId)]
        : []),
      ...(status ? [eq(schema.cashRegisterSessions.status, status)] : []),
    ];

    const whereClause = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.cashRegisterSessions)
      .innerJoin(
        schema.cashRegisters,
        eq(schema.cashRegisters.id, schema.cashRegisterSessions.cashRegisterId),
      )
      .where(whereClause);

    const totalCount = Number(totalResult.count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select({
        id: schema.cashRegisterSessions.id,
        cashRegisterId: schema.cashRegisterSessions.cashRegisterId,
        cashRegisterName: schema.cashRegisters.name,
        openedByUserId: schema.cashRegisterSessions.openedByUserId,
        closedByUserId: schema.cashRegisterSessions.closedByUserId,
        status: schema.cashRegisterSessions.status,
        initialBalance: schema.cashRegisterSessions.initialBalance,
        systemExpectedBalance:
          schema.cashRegisterSessions.systemExpectedBalance,
        actualPhysicalBalance:
          schema.cashRegisterSessions.actualPhysicalBalance,
        difference: schema.cashRegisterSessions.difference,
        openedAt: schema.cashRegisterSessions.openedAt,
        closedAt: schema.cashRegisterSessions.closedAt,
      })
      .from(schema.cashRegisterSessions)
      .innerJoin(
        schema.cashRegisters,
        eq(schema.cashRegisters.id, schema.cashRegisterSessions.cashRegisterId),
      )
      .where(whereClause)
      .orderBy(sql`${schema.cashRegisterSessions.openedAt} desc`)
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

  async open(userId: string, tenantId: string, dto: OpenCashSessionDto) {
    const result = await this.db.transaction(async (tx) => {
      const [register] = await tx
        .select()
        .from(schema.cashRegisters)
        .where(
          and(
            eq(schema.cashRegisters.id, dto.cashRegisterId),
            eq(schema.cashRegisters.tenantId, tenantId),
            eq(schema.cashRegisters.isActive, true),
          ),
        );

      if (!register) {
        throw new NotFoundException('Caja registradora no encontrada');
      }

      const [activeSession] = await tx
        .select()
        .from(schema.cashRegisterSessions)
        .where(
          and(
            eq(schema.cashRegisterSessions.cashRegisterId, dto.cashRegisterId),
            eq(schema.cashRegisterSessions.status, 'OPEN'),
          ),
        );

      if (activeSession) {
        throw new BadRequestException(
          'Ya existe una sesión de caja abierta para esta caja registradora',
        );
      }

      const [session] = await tx
        .insert(schema.cashRegisterSessions)
        .values({
          cashRegisterId: dto.cashRegisterId,
          openedByUserId: userId,
          status: 'OPEN',
          initialBalance: String(dto.initialBalance),
          systemExpectedBalance: String(dto.initialBalance),
          openedAt: new Date(),
          createdById: userId,
        })
        .returning();

      await tx.insert(schema.cashMovements).values({
        sessionId: session.id,
        type: 'INFLOW',
        amount: String(dto.initialBalance),
        concept: 'Saldo inicial de apertura de caja',
        referenceType: 'CASH_OPENING',
        createdById: userId,
      });

      return session;
    });

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'INSERT',
        tableName: 'cash_register_sessions',
        recordId: result.id,
        description: 'Sesión de caja abierta',
        area: 'Expenses',
        newData: result,
        tenantId,
      }),
    );

    return result;
  }

  async close(
    id: string,
    userId: string,
    tenantId: string,
    dto: CloseCashSessionDto,
  ) {
    const result = await this.db.transaction(async (tx) => {
      const [session] = await tx
        .select({
          id: schema.cashRegisterSessions.id,
          cashRegisterId: schema.cashRegisterSessions.cashRegisterId,
          status: schema.cashRegisterSessions.status,
          systemExpectedBalance:
            schema.cashRegisterSessions.systemExpectedBalance,
        })
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
            eq(schema.cashRegisterSessions.id, id),
            eq(schema.cashRegisters.tenantId, tenantId),
          ),
        );

      if (!session) {
        throw new NotFoundException('Sesión de caja no encontrada');
      }

      if (session.status === 'CLOSED') {
        throw new BadRequestException('La sesión de caja ya está cerrada');
      }

      const difference =
        dto.actualPhysicalBalance - Number(session.systemExpectedBalance);

      const [closed] = await tx
        .update(schema.cashRegisterSessions)
        .set({
          status: 'CLOSED',
          actualPhysicalBalance: String(dto.actualPhysicalBalance),
          difference: String(difference),
          closedByUserId: userId,
          closedAt: new Date(),
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(schema.cashRegisterSessions.id, id))
        .returning();

      return closed;
    });

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'cash_register_sessions',
        recordId: id,
        description: 'Sesión de caja cerrada',
        area: 'Expenses',
        newData: result,
        tenantId,
      }),
    );

    return result;
  }
}
