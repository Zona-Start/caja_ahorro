import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { IncomeStatementDto } from '../dto/income-statement.dto';
import { buildIncomeStatementTableContent } from '../templates/pdf/income-statement.template';

interface AccountNode {
  accountPlanId: string;
  accountCode: string;
  accountName: string;
  level: number;
  balance: string;
  balanceNum: number;
  children: AccountNode[];
}

@Injectable()
export class IncomeStatementService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  async getData(tenantId: string, filters: IncomeStatementDto) {
    const { accountingCycleId, startDate, endDate, detailLevel = 3 } = filters;

    if (startDate > endDate) {
      throw new BadRequestException(
        'La fecha desde no puede ser mayor que la fecha hasta.',
      );
    }

    // Los ingresos y egresos se calculan con los movimientos POSTED del rango.
    // No se usa account_balances porque esas cuentas de resultado no tienen
    // saldo inicial persistido, lo que hacía que el reporte mostrara todo en 0.
    const rawData = await this.drizzle
      .select({
        accountPlanId: schema.accountPlan.id,
        accountCode: schema.accountPlan.code,
        accountName: schema.accountPlan.name,
        accountType: schema.accountPlan.accountType,
        accountNature: schema.accountPlan.nature,
        level: schema.accountPlan.level,
        parentAccountId: schema.accountPlan.parentAccountId,
        finalBalance: sql<number>`
          COALESCE(SUM(
            CASE
              WHEN ${schema.accountingEntries.id} IS NULL THEN 0
              WHEN ${schema.accountPlan.accountType} = 'REVENUE'
                THEN ${schema.accountingEntryDetails.credit} - ${schema.accountingEntryDetails.debit}
              ELSE ${schema.accountingEntryDetails.debit} - ${schema.accountingEntryDetails.credit}
            END
          ), 0)
        `,
      })
      .from(schema.accountPlan)
      .leftJoin(
        schema.accountingEntryDetails,
        eq(schema.accountingEntryDetails.accountPlanId, schema.accountPlan.id),
      )
      .leftJoin(
        schema.accountingEntries,
        and(
          eq(
            schema.accountingEntries.id,
            schema.accountingEntryDetails.accountingEntryId,
          ),
          eq(schema.accountingEntries.tenantId, tenantId),
          eq(schema.accountingEntries.accountingCycleId, accountingCycleId),
          eq(schema.accountingEntries.status, 'POSTED'),
          gte(schema.accountingEntries.entryDate, startDate),
          lte(schema.accountingEntries.entryDate, endDate),
        ),
      )
      .where(
        and(
          eq(schema.accountPlan.tenantId, tenantId),
          inArray(schema.accountPlan.accountType, ['REVENUE', 'EXPENSE']),
        ),
      )
      .groupBy(
        schema.accountPlan.id,
        schema.accountPlan.code,
        schema.accountPlan.name,
        schema.accountPlan.accountType,
        schema.accountPlan.nature,
        schema.accountPlan.level,
        schema.accountPlan.parentAccountId,
      )
      .orderBy(asc(schema.accountPlan.code));

    const incomeAccounts = rawData;

    const tree = this.buildTree(incomeAccounts, detailLevel);

    const revenueAccounts = tree.filter(
      (n) =>
        incomeAccounts.find((r) => r.accountPlanId === n.accountPlanId)
          ?.accountType === 'REVENUE',
    );
    const expenseAccounts = tree.filter(
      (n) =>
        incomeAccounts.find((r) => r.accountPlanId === n.accountPlanId)
          ?.accountType === 'EXPENSE',
    );

    const totalRevenue = this.sumBalances(revenueAccounts);
    const totalExpense = this.sumBalances(expenseAccounts);
    const netIncome = totalRevenue - totalExpense;

    let cycleInfo: any = null;
    if (accountingCycleId) {
      const [cycle] = await this.drizzle
        .select({
          cycleId: schema.accountingCycles.id,
          description: schema.accountingCycles.description,
          startDate: schema.accountingCycles.startDate,
          endDate: schema.accountingCycles.endDate,
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
      revenue: {
        title: 'INGRESOS',
        accounts: this.toResponse(revenueAccounts),
        total: totalRevenue.toFixed(2),
      },
      expenses: {
        title: 'EGRESOS',
        accounts: this.toResponse(expenseAccounts),
        total: totalExpense.toFixed(2),
      },
      result: {
        grossProfit: totalRevenue.toFixed(2),
        operatingIncome: netIncome.toFixed(2),
        netIncome: netIncome.toFixed(2),
      },
      cycleInfo,
    };
  }

  private buildTree(
    rawData: any[],
    maxLevel: number,
    parentId: string | null = null,
  ): AccountNode[] {
    const children = rawData
      .filter(
        (r) =>
          r.parentAccountId === parentId || (!parentId && !r.parentAccountId),
      )
      .map((r) => ({
        accountPlanId: r.accountPlanId,
        accountCode: r.accountCode,
        accountName: r.accountName,
        level: r.level,
        balance: parseFloat(r.finalBalance ?? '0').toFixed(2),
        balanceNum: parseFloat(r.finalBalance ?? '0'),
        children:
          r.level < maxLevel
            ? this.buildTree(rawData, maxLevel, r.accountPlanId)
            : [],
      }));

    for (const node of children) {
      if (node.children.length > 0) {
        node.balanceNum = this.sumBalances(node.children);
        node.balance = node.balanceNum.toFixed(2);
      }
    }

    return children;
  }

  private sumBalances(nodes: AccountNode[]): number {
    return nodes.reduce((sum, n) => {
      const val =
        n.children.length > 0 ? this.sumBalances(n.children) : n.balanceNum;
      return sum + val;
    }, 0);
  }

  private toResponse(nodes: AccountNode[]): any[] {
    return nodes.map((n) => ({
      accountPlanId: n.accountPlanId,
      accountCode: n.accountCode,
      accountName: n.accountName,
      level: n.level,
      balance: n.balanceNum.toFixed(2),
      children: n.children.length > 0 ? this.toResponse(n.children) : undefined,
    }));
  }

  async generatePdf(tenantId: string, filters: IncomeStatementDto) {
    const data = await this.getData(tenantId, filters);

    const content = buildIncomeStatementTableContent(data);
    const dateLabel = this.buildFilterDateLabel(
      filters.startDate,
      filters.endDate,
    );
    const levelLabel = `Nivel de detalle: ${filters.detailLevel ?? 3}`;

    return this.pdfService.generateReport('ESTADO DE RESULTADOS', content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
      tenantId,
      subtitle: `${dateLabel} · ${levelLabel}`,
    });
  }

  private buildFilterDateLabel(startDate?: string, endDate?: string) {
    const format = (value?: string) => {
      if (!value) return null;
      const [year, month, day] = value.split('-');
      return year && month && day ? `${day}/${month}/${year}` : value;
    };

    const from = format(startDate);
    const to = format(endDate);

    if (from && to) return `Del ${from} al ${to}`;
    if (from) return `Desde ${from}`;
    if (to) return `Hasta ${to}`;
    return 'Todos los movimientos';
  }
}
