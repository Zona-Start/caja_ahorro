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
  ClosePettyCashSettlementDto,
  FilterPettyCashSettlementDto,
  OpenPettyCashSettlementDto,
} from './dto/petty-cash-settlements.schema';

const round = (value: number, decimals: number) =>
  Number(value.toFixed(decimals));

@Injectable()
export class PettyCashSettlementsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAllByPagination(
    tenantId: string,
    dto?: FilterPettyCashSettlementDto,
  ) {
    const { page = 1, limit = 10, fundId, period } = dto || {};
    const offset = (page - 1) * limit;

    const conditions = [
      eq(schema.pettyCashSettlements.tenantId, tenantId),
      ...(fundId ? [eq(schema.pettyCashSettlements.fundId, fundId)] : []),
      ...(period ? [eq(schema.pettyCashSettlements.period, period)] : []),
    ];
    const whereClause = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.pettyCashSettlements)
      .where(whereClause);
    const totalCount = Number(totalResult.count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select({
        id: schema.pettyCashSettlements.id,
        tenantId: schema.pettyCashSettlements.tenantId,
        fundId: schema.pettyCashSettlements.fundId,
        fundName: schema.pettyCashFunds.name,
        period: schema.pettyCashSettlements.period,
        openingBalance: schema.pettyCashSettlements.openingBalance,
        vouchersTotal: schema.pettyCashSettlements.vouchersTotal,
        expensesTotal: schema.pettyCashSettlements.expensesTotal,
        replenishmentsTotal: schema.pettyCashSettlements.replenishmentsTotal,
        physicalCount: schema.pettyCashSettlements.physicalCount,
        difference: schema.pettyCashSettlements.difference,
        notes: schema.pettyCashSettlements.notes,
        status: schema.pettyCashSettlements.status,
        closedByUserId: schema.pettyCashSettlements.closedByUserId,
        closedAt: schema.pettyCashSettlements.closedAt,
        createdAt: schema.pettyCashSettlements.createdAt,
      })
      .from(schema.pettyCashSettlements)
      .leftJoin(
        schema.pettyCashFunds,
        eq(schema.pettyCashFunds.id, schema.pettyCashSettlements.fundId),
      )
      .where(whereClause)
      .orderBy(sql`${schema.pettyCashSettlements.period} desc`)
      .limit(limit)
      .offset(offset);

    return {
      data: data.map((d) => ({
        ...d,
        openingBalance: Number(d.openingBalance),
        vouchersTotal: Number(d.vouchersTotal),
        expensesTotal: Number(d.expensesTotal),
        replenishmentsTotal: Number(d.replenishmentsTotal),
        physicalCount: d.physicalCount != null ? Number(d.physicalCount) : null,
        difference: d.difference != null ? Number(d.difference) : null,
      })),
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
      .from(schema.pettyCashSettlements)
      .where(
        and(
          eq(schema.pettyCashSettlements.id, id),
          eq(schema.pettyCashSettlements.tenantId, tenantId),
        ),
      );
    if (!row) {
      throw new NotFoundException(`Arqueo con ID ${id} no encontrado`);
    }
    return row;
  }

  // Abre (o recalcula) el arqueo del período para un fondo fijo
  async open(
    userId: string,
    tenantId: string,
    dto: OpenPettyCashSettlementDto,
  ) {
    const period = dto.period ?? new Date().toISOString().slice(0, 7);

    const result = await this.db.transaction(async (tx) => {
      const [fund] = await tx
        .select()
        .from(schema.pettyCashFunds)
        .where(
          and(
            eq(schema.pettyCashFunds.id, dto.fundId),
            eq(schema.pettyCashFunds.tenantId, tenantId),
          ),
        );
      if (!fund) {
        throw new NotFoundException('Fondo fijo no encontrado');
      }

      const [existing] = await tx
        .select()
        .from(schema.pettyCashSettlements)
        .where(
          and(
            eq(schema.pettyCashSettlements.fundId, fund.id),
            eq(schema.pettyCashSettlements.period, period),
          ),
        );
      if (existing) {
        if (existing.status === 'CLOSED') {
          throw new BadRequestException(
            `El arqueo del período ${period} para este fondo ya está cerrado`,
          );
        }
        return existing;
      }

      // Saldo inicial: conteo físico del arqueo anterior o monto asignado
      const [previous] = await tx
        .select()
        .from(schema.pettyCashSettlements)
        .where(
          and(
            eq(schema.pettyCashSettlements.fundId, fund.id),
            eq(schema.pettyCashSettlements.status, 'CLOSED'),
            sql`${schema.pettyCashSettlements.period} < ${period}`,
          ),
        )
        .orderBy(sql`${schema.pettyCashSettlements.period} desc`)
        .limit(1);

      const openingBalance = previous?.physicalCount
        ? Number(previous.physicalCount)
        : Number(fund.assignedAmount);

      const [settlement] = await tx
        .insert(schema.pettyCashSettlements)
        .values({
          tenantId,
          fundId: fund.id,
          period,
          openingBalance: String(openingBalance),
          status: 'OPEN',
          createdById: userId,
        })
        .returning();

      return settlement;
    });

    // Refresca los totales del período
    const refreshed = await this.refreshTotals(result, tenantId);

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'INSERT',
        tableName: 'petty_cash_settlements',
        recordId: result.id,
        description: `Arqueo de fondo fijo abierto: período ${period}`,
        area: 'Expenses',
        newData: refreshed,
        tenantId,
      }),
    );

    return this.mapNumeric(refreshed);
  }

  async refreshSettlement(id: string, tenantId: string) {
    const settlement = await this.findOne(id, tenantId);
    const refreshed = await this.refreshTotals(settlement, tenantId);
    return this.mapNumeric(refreshed);
  }

  // Cierra el arqueo con el conteo físico y calcula la diferencia
  async close(
    id: string,
    userId: string,
    tenantId: string,
    dto: ClosePettyCashSettlementDto,
  ) {
    const settlement = await this.findOne(id, tenantId);
    if (settlement.status !== 'OPEN') {
      throw new BadRequestException('El arqueo ya está cerrado');
    }

    const periodSettlements = await this.refreshTotals(settlement, tenantId);

    const expensesTotal = Number(periodSettlements.expensesTotal);
    const vouchersTotal = Number(periodSettlements.vouchersTotal);
    const opening = Number(periodSettlements.openingBalance);
    const replenishments = dto.replenishmentsTotal ?? 0;

    // Saldo esperado = apertura + reposiciones − gastos − vales abiertos
    const expected = opening + replenishments - expensesTotal - vouchersTotal;
    const difference = round(dto.physicalCount - expected, 4);

    const [closed] = await this.db
      .update(schema.pettyCashSettlements)
      .set({
        vouchersTotal: periodSettlements.vouchersTotal,
        expensesTotal: periodSettlements.expensesTotal,
        replenishmentsTotal: String(replenishments),
        physicalCount: String(dto.physicalCount),
        difference: String(difference),
        notes: dto.notes ?? null,
        status: 'CLOSED',
        closedByUserId: userId,
        closedAt: new Date(),
        updatedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.pettyCashSettlements.id, id))
      .returning();

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'petty_cash_settlements',
        recordId: id,
        description: `Arqueo cerrado: período ${closed.period} (diferencia ${difference})`,
        area: 'Expenses',
        previousData: settlement,
        newData: closed,
        tenantId,
      }),
    );

    return this.mapNumeric(closed);
  }

  // ──────────────────────────────────────────────────────────────
  //  HELPERS
  // ──────────────────────────────────────────────────────────────

  private async refreshTotals(
    settlement: typeof schema.pettyCashSettlements.$inferSelect,
    tenantId: string,
  ) {
    const [expensesAgg] = await this.db
      .select({
        total: sql<number>`COALESCE(SUM(${schema.expenses.amountBase}), 0)`,
      })
      .from(schema.expenses)
      .where(
        and(
          eq(schema.expenses.pettyCashFundId, settlement.fundId),
          eq(schema.expenses.tenantId, tenantId),
          eq(schema.expenses.status, 'APPROVED'),
          sql`TO_CHAR(${schema.expenses.createdAt}, 'YYYY-MM') = ${settlement.period}`,
          sql`${schema.expenses.deletedAt} IS NULL`,
        ),
      );

    const [vouchersAgg] = await this.db
      .select({
        total: sql<number>`COALESCE(SUM(${schema.pettyCashVouchers.amount}), 0)`,
      })
      .from(schema.pettyCashVouchers)
      .where(
        and(
          eq(schema.pettyCashVouchers.fundId, settlement.fundId),
          eq(schema.pettyCashVouchers.tenantId, tenantId),
          eq(schema.pettyCashVouchers.status, 'OPEN'),
        ),
      );

    const [updated] = await this.db
      .update(schema.pettyCashSettlements)
      .set({
        expensesTotal: String(Number(expensesAgg?.total ?? 0)),
        vouchersTotal: String(Number(vouchersAgg?.total ?? 0)),
        updatedAt: new Date(),
      })
      .where(eq(schema.pettyCashSettlements.id, settlement.id))
      .returning();

    return updated;
  }

  private mapNumeric(row: typeof schema.pettyCashSettlements.$inferSelect) {
    return {
      ...row,
      openingBalance: Number(row.openingBalance),
      vouchersTotal: Number(row.vouchersTotal),
      expensesTotal: Number(row.expensesTotal),
      replenishmentsTotal: Number(row.replenishmentsTotal),
      physicalCount:
        row.physicalCount != null ? Number(row.physicalCount) : null,
      difference: row.difference != null ? Number(row.difference) : null,
    };
  }
}
