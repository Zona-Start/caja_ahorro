import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gt, gte, lt, lte, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { TrialBalanceDto } from '../dto/trial-balance.dto';
import { buildTrialBalanceTableContent } from '../templates/pdf/trial-balance.template';

@Injectable()
export class TrialBalanceService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  /**
   * Agrega débitos y créditos por cuenta contable a partir de los ASIENTOS
   * CONTABLES (accounting_entry_details + accounting_entries POSTED).
   * Nunca usa la tabla de saldos (account_balances).
   * Siempre filtra por ciclo contable.
   */
  private async aggregateMovements(
    tenantId: string,
    accountingCycleId: string,
    fromDate?: string,
    toDate?: string,
    exclusiveStart = false,
    exclusiveEnd = false,
  ) {
    const conditions: any[] = [
      eq(schema.accountingEntries.tenantId, tenantId),
      eq(schema.accountingEntries.status, 'POSTED'),
      eq(schema.accountingEntries.accountingCycleId, accountingCycleId),
    ];

    if (fromDate) {
      conditions.push(
        exclusiveStart
          ? gt(schema.accountingEntries.entryDate, fromDate)
          : gte(schema.accountingEntries.entryDate, fromDate),
      );
    }
    if (toDate) {
      conditions.push(
        exclusiveEnd
          ? lt(schema.accountingEntries.entryDate, toDate)
          : lte(schema.accountingEntries.entryDate, toDate),
      );
    }

    const rows = await this.drizzle
      .select({
        accountPlanId: schema.accountingEntryDetails.accountPlanId,
        debit: sql<string>`COALESCE(SUM(${schema.accountingEntryDetails.debit}), 0)::text`,
        credit: sql<string>`COALESCE(SUM(${schema.accountingEntryDetails.credit}), 0)::text`,
      })
      .from(schema.accountingEntryDetails)
      .innerJoin(
        schema.accountingEntries,
        eq(
          schema.accountingEntryDetails.accountingEntryId,
          schema.accountingEntries.id,
        ),
      )
      .where(and(...conditions))
      .groupBy(schema.accountingEntryDetails.accountPlanId);

    const map = new Map<string, { debit: number; credit: number }>();
    for (const r of rows) {
      map.set(r.accountPlanId, {
        debit: parseFloat(r.debit),
        credit: parseFloat(r.credit),
      });
    }
    return map;
  }

  async getData(tenantId: string, filters: TrialBalanceDto) {
    const {
      accountingCycleId,
      startDate,
      endDate,
      onlyWithMovements = 'true',
    } = filters;

    // 1. Ciclo contable (cabecera del reporte)
    const [cycle] = await this.drizzle
      .select({
        cycleId: schema.accountingCycles.id,
        description: schema.accountingCycles.description,
        startDate: schema.accountingCycles.startDate,
        endDate: schema.accountingCycles.endDate,
        status: schema.accountingCycles.status,
      })
      .from(schema.accountingCycles)
      .where(
        and(
          eq(schema.accountingCycles.id, accountingCycleId),
          eq(schema.accountingCycles.tenantId, tenantId),
        ),
      )
      .limit(1);

    // 2. Cuentas que permiten movimientos
    const accountRows = await this.drizzle
      .select({
        id: schema.accountPlan.id,
        code: schema.accountPlan.code,
        name: schema.accountPlan.name,
        accountType: schema.accountPlan.accountType,
        nature: schema.accountPlan.nature,
        level: schema.accountPlan.level,
      })
      .from(schema.accountPlan)
      .where(
        and(
          eq(schema.accountPlan.tenantId, tenantId),
          eq(schema.accountPlan.allowsMovements, true),
        ),
      )
      .orderBy(asc(schema.accountPlan.code));

    // 3. Saldo inicial: asientos POSTED del ciclo hasta la fecha "desde" (inclusive).
    //    Incluye el asiento de carga inicial (voucher 1) como saldo inicial.
    const initialMap = await this.aggregateMovements(
      tenantId,
      accountingCycleId,
      undefined,
      startDate,
      false,
      false,
    );

    // 4. Movimientos del período: asientos POSTED del ciclo en (desde, hasta]
    const periodMap = await this.aggregateMovements(
      tenantId,
      accountingCycleId,
      startDate,
      endDate,
      true,
      false,
    );

    // 5. Combinar
    const allAccounts = accountRows.map((a) => {
      const initial = initialMap.get(a.id) ?? { debit: 0, credit: 0 };
      const period = periodMap.get(a.id) ?? { debit: 0, credit: 0 };

      const initialBalance = initial.debit - initial.credit;
      const periodDebit = period.debit;
      const periodCredit = period.credit;
      const currentBalance = initialBalance + periodDebit - periodCredit;

      return {
        accountPlanId: a.id,
        accountCode: a.code,
        accountName: a.name,
        accountType: a.accountType,
        accountNature: a.nature,
        level: a.level,
        initialBalanceNum: initialBalance,
        periodDebitNum: periodDebit,
        periodCreditNum: periodCredit,
        currentBalanceNum: currentBalance,
      };
    });

    const filtered =
      onlyWithMovements === 'true'
        ? allAccounts.filter(
            (a) =>
              Math.abs(a.initialBalanceNum) > 0.000001 ||
              Math.abs(a.periodDebitNum) > 0.000001 ||
              Math.abs(a.periodCreditNum) > 0.000001,
          )
        : allAccounts;

    // 6. Totales
    let totalInitialDebit = 0;
    let totalInitialCredit = 0;
    let totalPeriodDebit = 0;
    let totalPeriodCredit = 0;
    let totalCurrentDebit = 0;
    let totalCurrentCredit = 0;

    for (const a of filtered) {
      totalPeriodDebit += a.periodDebitNum;
      totalPeriodCredit += a.periodCreditNum;

      if (a.initialBalanceNum > 0) totalInitialDebit += a.initialBalanceNum;
      else if (a.initialBalanceNum < 0)
        totalInitialCredit += Math.abs(a.initialBalanceNum);

      if (a.currentBalanceNum > 0) totalCurrentDebit += a.currentBalanceNum;
      else if (a.currentBalanceNum < 0)
        totalCurrentCredit += Math.abs(a.currentBalanceNum);
    }

    const accounts = filtered.map((a) => ({
      accountPlanId: a.accountPlanId,
      accountCode: a.accountCode,
      accountName: a.accountName,
      accountType: a.accountType,
      accountNature: a.accountNature,
      level: a.level,
      initialBalance: a.initialBalanceNum.toFixed(6),
      periodDebit: a.periodDebitNum.toFixed(6),
      periodCredit: a.periodCreditNum.toFixed(6),
      currentBalance: a.currentBalanceNum.toFixed(6),
    }));

    return {
      accounts,
      summary: {
        totalInitialDebit: totalInitialDebit.toFixed(6),
        totalInitialCredit: totalInitialCredit.toFixed(6),
        totalPeriodDebit: totalPeriodDebit.toFixed(6),
        totalPeriodCredit: totalPeriodCredit.toFixed(6),
        totalCurrentDebit: totalCurrentDebit.toFixed(6),
        totalCurrentCredit: totalCurrentCredit.toFixed(6),
      },
      cycleInfo: cycle ?? null,
      range: { startDate, endDate },
    };
  }

  async generatePdf(tenantId: string, filters: TrialBalanceDto) {
    const data = await this.getData(tenantId, filters);

    const content = buildTrialBalanceTableContent(data);
    return this.pdfService.generateReport('BALANCE DE COMPROBACIÓN', content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
    });
  }
}
