import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, eq, lte, sql } from 'drizzle-orm';
import { TrialBalanceDto } from '../dto/trial-balance.dto';
import { buildTrialBalanceTableContent } from '../templates/pdf/trial-balance.template';

@Injectable()
export class TrialBalanceService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  async getData(tenantId: string, filters: TrialBalanceDto) {
    const { accountingCycleId, level, onlyWithMovements = 'true' } = filters;

    const conditions: any[] = [
      eq(schema.accountBalances.tenantId, tenantId),
      eq(schema.accountPlan.allowsMovements, true),
    ];

    if (accountingCycleId) {
      conditions.push(
        eq(schema.accountBalances.accountingCyclesId, accountingCycleId),
      );
    }

    if (level) {
      conditions.push(lte(schema.accountPlan.level, level));
    }

    if (onlyWithMovements === 'true') {
      conditions.push(
        sql`(
          ${schema.accountBalances.initialBalance} != '0.00'
          OR ${schema.accountBalances.debitBalance} != '0.00'
          OR ${schema.accountBalances.creditBalance} != '0.00'
        )`,
      );
    }

    const rawData = await this.drizzle
      .select({
        accountPlanId: schema.accountPlan.id,
        accountCode: schema.accountPlan.code,
        accountName: schema.accountPlan.name,
        accountType: schema.accountPlan.accountType,
        accountNature: schema.accountPlan.nature,
        level: schema.accountPlan.level,
        initialBalance: schema.accountBalances.initialBalance,
        debitBalance: schema.accountBalances.debitBalance,
        creditBalance: schema.accountBalances.creditBalance,
        finalBalance: schema.accountBalances.finalBalance,
      })
      .from(schema.accountBalances)
      .innerJoin(
        schema.accountPlan,
        eq(schema.accountBalances.accountPlanId, schema.accountPlan.id),
      )
      .where(and(...conditions))
      .orderBy(asc(schema.accountPlan.code));

    const accounts = rawData.map((r) => ({
      accountPlanId: r.accountPlanId,
      accountCode: r.accountCode,
      accountName: r.accountName,
      accountType: r.accountType,
      accountNature: r.accountNature,
      level: r.level,
      initialBalance: r.initialBalance ?? '0.00',
      periodDebit: r.debitBalance ?? '0.00',
      periodCredit: r.creditBalance ?? '0.00',
      currentBalance: r.finalBalance ?? '0.00',
    }));

    let totalInitialDebit = 0;
    let totalInitialCredit = 0;
    let totalPeriodDebit = 0;
    let totalPeriodCredit = 0;
    let totalCurrentDebit = 0;
    let totalCurrentCredit = 0;

    for (const a of accounts) {
      const initBal = parseFloat(a.initialBalance);
      const periodDeb = parseFloat(a.periodDebit);
      const periodCred = parseFloat(a.periodCredit);
      const currBal = parseFloat(a.currentBalance);

      totalPeriodDebit += periodDeb;
      totalPeriodCredit += periodCred;

      if (a.accountNature === 'DEBIT') {
        if (initBal > 0) totalInitialDebit += initBal;
        else if (initBal < 0) totalInitialCredit += Math.abs(initBal);
        if (currBal > 0) totalCurrentDebit += currBal;
        else if (currBal < 0) totalCurrentCredit += Math.abs(currBal);
      } else {
        if (initBal < 0) totalInitialCredit += Math.abs(initBal);
        else if (initBal > 0) totalInitialDebit += initBal;
        if (currBal < 0) totalCurrentCredit += Math.abs(currBal);
        else if (currBal > 0) totalCurrentDebit += currBal;
      }
    }

    let cycleInfo: any = null;
    if (accountingCycleId) {
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

      if (cycle) {
        cycleInfo = cycle;
      }
    }

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
      cycleInfo,
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
