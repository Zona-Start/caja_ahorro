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
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  ClosePettyCashSettlementDto,
  FilterPettyCashSettlementDto,
  OpenPettyCashSettlementDto,
  PreviewPettyCashSettlementDto,
  RealizePettyCashSettlementDto,
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
        currencyCode: schema.pettyCashFunds.currencyCode,
        period: schema.pettyCashSettlements.period,
        openingBalance: schema.pettyCashSettlements.openingBalance,
        vouchersTotal: schema.pettyCashSettlements.vouchersTotal,
        expensesTotal: schema.pettyCashSettlements.expensesTotal,
        replenishmentsTotal: schema.pettyCashSettlements.replenishmentsTotal,
        physicalCount: schema.pettyCashSettlements.physicalCount,
        difference: schema.pettyCashSettlements.difference,
        notes: schema.pettyCashSettlements.notes,
        status: schema.pettyCashSettlements.status,
        replenishmentStatus: schema.pettyCashSettlements.replenishmentStatus,
        replenishmentAmount: schema.pettyCashSettlements.replenishmentAmount,
        replenishmentRequestedAt:
          schema.pettyCashSettlements.replenishmentRequestedAt,
        replenishmentPaidAt: schema.pettyCashSettlements.replenishmentPaidAt,
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
        replenishmentAmount: Number(d.replenishmentAmount),
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

  // ──────────────────────────────────────────────────────────────
  //  ARQUEO DE UNA SOLA VEZ (foto instantánea de control)
  // ──────────────────────────────────────────────────────────────

  // Calcula los montos del período para un fondo (sin persistir)
  async computePeriodTotals(
    tenantId: string,
    fundId: string,
    period: string,
    tx?: DrizzleDatabase,
  ) {
    const db = tx ?? this.db;
    const [fund] = await db
      .select()
      .from(schema.pettyCashFunds)
      .where(
        and(
          eq(schema.pettyCashFunds.id, fundId),
          eq(schema.pettyCashFunds.tenantId, tenantId),
        ),
      );
    if (!fund) {
      throw new NotFoundException('Fondo fijo no encontrado');
    }

    // Saldo de apertura: conteo físico del arqueo anterior o monto asignado
    const [previous] = await db
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

    const totals = await this.aggregatePeriod(tenantId, fund.id, period, db);

    // Esperado = apertura − gastos − vales abiertos (reposiciones se suman aparte)
    const expected =
      openingBalance - totals.expensesTotal - totals.vouchersTotal;

    return {
      fundId: fund.id,
      fundName: fund.name,
      currencyCode: fund.currencyCode,
      period,
      openingBalance,
      expensesTotal: totals.expensesTotal,
      vouchersTotal: totals.vouchersTotal,
      replenishmentsTotal: 0,
      expected,
    };
  }

  // Vista previa para el formulario de arqueo (no persiste)
  async preview(tenantId: string, dto: PreviewPettyCashSettlementDto) {
    const period = dto.period ?? new Date().toISOString().slice(0, 7);
    return await this.computePeriodTotals(tenantId, dto.fundId, period);
  }

  // Realiza el arqueo: calcula, guarda, cierra las transacciones del período
  // y ajusta el fondo si hay faltante.
  async realize(
    userId: string,
    tenantId: string,
    dto: RealizePettyCashSettlementDto,
  ) {
    const period = dto.period ?? new Date().toISOString().slice(0, 7);

    const result = await this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: schema.pettyCashSettlements.id })
        .from(schema.pettyCashSettlements)
        .where(
          and(
            eq(schema.pettyCashSettlements.fundId, dto.fundId),
            eq(schema.pettyCashSettlements.tenantId, tenantId),
            eq(schema.pettyCashSettlements.period, period),
          ),
        );
      if (existing) {
        throw new BadRequestException(
          `Ya existe un arqueo para este fondo en el período ${period}`,
        );
      }

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

      const totals = await this.computePeriodTotals(
        tenantId,
        dto.fundId,
        period,
        tx as unknown as DrizzleDatabase,
      );
      const replenishments = dto.replenishmentsTotal ?? 0;
      const expected =
        totals.openingBalance +
        replenishments -
        totals.expensesTotal -
        totals.vouchersTotal;
      const difference = round(dto.physicalCount - expected, 4);

      const [created] = await tx
        .insert(schema.pettyCashSettlements)
        .values({
          tenantId,
          fundId: dto.fundId,
          period,
          openingBalance: String(totals.openingBalance),
          vouchersTotal: String(totals.vouchersTotal),
          expensesTotal: String(totals.expensesTotal),
          replenishmentsTotal: String(replenishments),
          physicalCount: String(dto.physicalCount),
          difference: String(difference),
          notes: dto.notes ?? null,
          status: 'CLOSED',
          closedByUserId: userId,
          closedAt: new Date(),
          createdById: userId,
        })
        .returning();

      // 1. BLOQUEO: marcar gastos y vales del período como "Cerrados por Arqueo"
      //    para que no vuelvan a entrar en el arqueo del próximo mes.
      await tx
        .update(schema.expenses)
        .set({
          pettyCashSettlementId: created.id,
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.expenses.pettyCashFundId, dto.fundId),
            eq(schema.expenses.tenantId, tenantId),
            sql`${schema.expenses.status} IN ('APPROVED', 'PAID')`,
            sql`TO_CHAR(${schema.expenses.createdAt}, 'YYYY-MM') = ${period}`,
            sql`${schema.expenses.deletedAt} IS NULL`,
            sql`${schema.expenses.pettyCashSettlementId} IS NULL`,
          ),
        );

      await tx
        .update(schema.pettyCashVouchers)
        .set({
          status: 'SETTLED',
          settlementId: created.id,
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.pettyCashVouchers.fundId, dto.fundId),
            eq(schema.pettyCashVouchers.tenantId, tenantId),
            eq(schema.pettyCashVouchers.status, 'OPEN'),
            sql`${schema.pettyCashVouchers.settlementId} IS NULL`,
          ),
        );

      // Vales ya rendidos cuyo gasto entró en este arqueo → Cerrados por Arqueo
      const settledExpenses = await tx
        .select({ id: schema.expenses.id })
        .from(schema.expenses)
        .where(eq(schema.expenses.pettyCashSettlementId, created.id));
      const settledExpenseIds = settledExpenses.map((e) => e.id);

      if (settledExpenseIds.length > 0) {
        await tx
          .update(schema.pettyCashVouchers)
          .set({
            status: 'SETTLED',
            settlementId: created.id,
            updatedById: userId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.pettyCashVouchers.fundId, dto.fundId),
              eq(schema.pettyCashVouchers.tenantId, tenantId),
              eq(schema.pettyCashVouchers.status, 'LIQUIDATED'),
              sql`${schema.pettyCashVouchers.settlementId} IS NULL`,
              inArray(schema.pettyCashVouchers.expenseId, settledExpenseIds),
            ),
          );
      }

      // 2. FALTANTE: forzar el saldo al conteo físico real y registrar el
      //    gasto interno por el dinero que no aparece.
      if (difference < 0) {
        const shortfall = round(Math.abs(difference), 4);

        await tx
          .update(schema.pettyCashFunds)
          .set({
            currentBalance: String(dto.physicalCount),
            updatedById: userId,
            updatedAt: new Date(),
          })
          .where(eq(schema.pettyCashFunds.id, dto.fundId));

        const category = await this.getOrCreateShortfallCategory(
          tx as unknown as DrizzleDatabase,
          tenantId,
          userId,
        );

        const description = `Faltante de Caja Chica — Arqueo ${period}`;
        const [shortExpense] = await tx
          .insert(schema.expenses)
          .values({
            tenantId,
            costCenterId: null,
            categoryId: category.id,
            paymentSource: 'PETTY_CASH',
            pettyCashFundId: dto.fundId,
            type: 'EXPRESS',
            paymentStatus: 'PAID',
            status: 'PAID',
            nature: 'VARIABLE',
            amountBase: String(shortfall),
            taxAmountBase: '0.0000',
            currencyCode: fund.currencyCode,
            exchangeRate: '1',
            description,
            pettyCashSettlementId: created.id,
            createdById: userId,
            approvedByUserId: userId,
            approvedAt: new Date(),
            paidByUserId: userId,
            paidAt: new Date(),
          })
          .returning();

        await tx.insert(schema.expenseDetails).values({
          expenseId: shortExpense.id,
          tenantId,
          categoryId: category.id,
          description,
          amount: String(shortfall),
          taxRate: '0',
          taxAmount: '0',
          isExempt: true,
        });
      }

      return { settlement: created, expected };
    });

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'INSERT',
        tableName: 'petty_cash_settlements',
        recordId: result.settlement.id,
        description: `Arqueo realizado: ${dto.fundId} período ${period}`,
        area: 'Expenses',
        newData: result.settlement,
        tenantId,
      }),
    );

    return {
      ...this.mapNumeric(result.settlement),
      expected: result.expected,
    };
  }

  // Reposición de efectivo: envía el monto gastado a la cola de pagos
  async replenish(userId: string, tenantId: string, id: string) {
    const settlement = await this.findOne(id, tenantId);
    if (settlement.status !== 'CLOSED') {
      throw new BadRequestException('Solo se puede reponer un arqueo cerrado');
    }
    if (settlement.replenishmentStatus === 'PAID') {
      throw new BadRequestException('La reposición ya fue pagada');
    }
    const amount = Number(settlement.expensesTotal);
    if (amount <= 0) {
      throw new BadRequestException(
        'No hay gastos que reponer en este período',
      );
    }

    const [updated] = await this.db
      .update(schema.pettyCashSettlements)
      .set({
        replenishmentStatus: 'PENDING',
        replenishmentAmount: String(amount),
        replenishmentRequestedAt: new Date(),
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
        description: `Reposición de fondo solicitada por ${amount}`,
        area: 'Expenses',
        newData: updated,
        tenantId,
      }),
    );

    return this.mapNumeric(updated);
  }

  // Paga la reposición: suma el monto al saldo actual del fondo
  async payReplenishment(userId: string, tenantId: string, id: string) {
    const settlement = await this.findOne(id, tenantId);
    if (settlement.replenishmentStatus !== 'PENDING') {
      throw new BadRequestException(
        'No hay una reposición pendiente para este arqueo',
      );
    }
    const amount = Number(settlement.replenishmentAmount);

    const updated = await this.db.transaction(async (tx) => {
      const [fund] = await tx
        .select()
        .from(schema.pettyCashFunds)
        .where(eq(schema.pettyCashFunds.id, settlement.fundId));
      if (!fund) {
        throw new NotFoundException('Fondo fijo no encontrado');
      }

      const newBalance = Number(fund.currentBalance) + amount;
      await tx
        .update(schema.pettyCashFunds)
        .set({
          currentBalance: String(newBalance),
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(schema.pettyCashFunds.id, fund.id));

      const [row] = await tx
        .update(schema.pettyCashSettlements)
        .set({
          replenishmentStatus: 'PAID',
          replenishmentPaidAt: new Date(),
          replenishmentPaidByUserId: userId,
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(schema.pettyCashSettlements.id, id))
        .returning();
      return row;
    });

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'petty_cash_settlements',
        recordId: id,
        description: `Reposición de fondo pagada por ${amount}`,
        area: 'Expenses',
        newData: updated,
        tenantId,
      }),
    );

    return this.mapNumeric(updated);
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

  private async aggregatePeriod(
    tenantId: string,
    fundId: string,
    period: string,
    tx?: DrizzleDatabase,
  ) {
    const db = tx ?? this.db;
    const [expensesAgg] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${schema.expenses.amountBase}), 0)`,
      })
      .from(schema.expenses)
      .where(
        and(
          eq(schema.expenses.pettyCashFundId, fundId),
          eq(schema.expenses.tenantId, tenantId),
          sql`${schema.expenses.status} IN ('APPROVED', 'PAID')`,
          sql`TO_CHAR(${schema.expenses.createdAt}, 'YYYY-MM') = ${period}`,
          sql`${schema.expenses.deletedAt} IS NULL`,
          // Excluye lo ya cerrado en un arqueo anterior
          sql`${schema.expenses.pettyCashSettlementId} IS NULL`,
        ),
      );

    const [vouchersAgg] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${schema.pettyCashVouchers.amount}), 0)`,
      })
      .from(schema.pettyCashVouchers)
      .where(
        and(
          eq(schema.pettyCashVouchers.fundId, fundId),
          eq(schema.pettyCashVouchers.tenantId, tenantId),
          eq(schema.pettyCashVouchers.status, 'OPEN'),
          // Excluye vales ya cerrados en un arqueo anterior
          sql`${schema.pettyCashVouchers.settlementId} IS NULL`,
        ),
      );

    return {
      expensesTotal: Number(expensesAgg?.total ?? 0),
      vouchersTotal: Number(vouchersAgg?.total ?? 0),
    };
  }

  // Busca o crea la categoría "Faltante de Caja Chica"
  private async getOrCreateShortfallCategory(
    db: DrizzleDatabase,
    tenantId: string,
    userId: string,
  ) {
    const [existing] = await db
      .select()
      .from(schema.expenseCategories)
      .where(
        and(
          eq(schema.expenseCategories.tenantId, tenantId),
          eq(schema.expenseCategories.name, 'Faltante de Caja Chica'),
        ),
      )
      .limit(1);
    if (existing) return existing;

    const [created] = await db
      .insert(schema.expenseCategories)
      .values({
        tenantId,
        name: 'Faltante de Caja Chica',
        isActive: true,
        createdById: userId,
      })
      .returning();
    return created;
  }

  private async refreshTotals(
    settlement: typeof schema.pettyCashSettlements.$inferSelect,
    tenantId: string,
  ) {
    const totals = await this.aggregatePeriod(
      tenantId,
      settlement.fundId,
      settlement.period,
    );

    const [updated] = await this.db
      .update(schema.pettyCashSettlements)
      .set({
        expensesTotal: String(totals.expensesTotal),
        vouchersTotal: String(totals.vouchersTotal),
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
      replenishmentAmount: Number(row.replenishmentAmount),
      physicalCount:
        row.physicalCount != null ? Number(row.physicalCount) : null,
      difference: row.difference != null ? Number(row.difference) : null,
    };
  }
}
