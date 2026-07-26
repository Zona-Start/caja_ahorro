import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, eq } from 'drizzle-orm';
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
    const { accountingCycleId, detailLevel = 3 } = filters;

    const joinConditions: any[] = [
      eq(schema.accountBalances.accountPlanId, schema.accountPlan.id),
      eq(schema.accountBalances.tenantId, tenantId),
    ];

    if (accountingCycleId) {
      joinConditions.push(
        eq(schema.accountBalances.accountingCyclesId, accountingCycleId),
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
        parentAccountId: schema.accountPlan.parentAccountId,
        finalBalance: schema.accountBalances.finalBalance,
      })
      .from(schema.accountPlan)
      .leftJoin(
        schema.accountBalances,
        and(...joinConditions),
      )
      .where(
        eq(schema.accountPlan.tenantId, tenantId),
      )
      .orderBy(asc(schema.accountPlan.code));

    const incomeAccounts = rawData.filter(
      (r) =>
        r.accountType === 'REVENUE' || r.accountType === 'EXPENSE',
    );

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

    // Revenue is stored as negative (CREDIT nature), so use absolute value
    const totalRevenueAbs = Math.abs(totalRevenue);
    const totalExpenseAbs = totalExpense;
    const netIncome = totalRevenueAbs - totalExpenseAbs;

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
        total: totalRevenueAbs.toFixed(2),
      },
      expenses: {
        title: 'EGRESOS',
        accounts: this.toResponse(expenseAccounts),
        total: totalExpenseAbs.toFixed(2),
      },
      result: {
        grossProfit: totalRevenueAbs.toFixed(2),
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
          r.parentAccountId === parentId ||
          (!parentId && !r.parentAccountId),
      )
      .map((r) => ({
        accountPlanId: r.accountPlanId,
        accountCode: r.accountCode,
        accountName: r.accountName,
        level: r.level,
        balance: (parseFloat(r.finalBalance ?? '0')).toFixed(2),
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
      balance: Math.abs(n.balanceNum).toFixed(2),
      children: n.children.length > 0 ? this.toResponse(n.children) : undefined,
    }));
  }

  async generatePdf(tenantId: string, filters: IncomeStatementDto) {
    const data = await this.getData(tenantId, filters);

    const content = buildIncomeStatementTableContent(data);
    return this.pdfService.generateReport('ESTADO DE RESULTADOS', content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
    });
  }
}
