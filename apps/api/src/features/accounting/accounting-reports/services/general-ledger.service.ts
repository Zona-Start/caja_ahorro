import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { GeneralLedgerDto } from '../dto/general-ledger.dto';
import { buildGeneralLedgerTableContent } from '../templates/pdf/general-ledger.template';

@Injectable()
export class GeneralLedgerService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  async getData(tenantId: string, filters: GeneralLedgerDto) {
    const {
      accountingCycleId,
      startDate,
      endDate,
      accountPlanId,
      page = 1,
      limit = 50,
    } = filters;

    const accountConditions: any[] = [
      eq(schema.accountPlan.tenantId, tenantId),
      eq(schema.accountPlan.allowsMovements, true),
    ];

    if (accountPlanId) {
      accountConditions.push(eq(schema.accountPlan.id, accountPlanId));
    }

    const offset = (page - 1) * limit;

    const [countResult] = await this.drizzle
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(schema.accountPlan)
      .where(and(...accountConditions));

    const totalCount = countResult?.count ?? 0;

    const accounts = await this.drizzle
      .select({
        id: schema.accountPlan.id,
        code: schema.accountPlan.code,
        name: schema.accountPlan.name,
        nature: schema.accountPlan.nature,
      })
      .from(schema.accountPlan)
      .where(and(...accountConditions))
      .orderBy(asc(schema.accountPlan.code))
      .limit(limit)
      .offset(offset);

    const accountIds = accounts.map((a) => a.id);

    // Get initial balances
    let balances: any[] = [];
    if (accountingCycleId && accountIds.length > 0) {
      balances = await this.drizzle
        .select({
          accountPlanId: schema.accountBalances.accountPlanId,
          initialBalance: schema.accountBalances.initialBalance,
          finalBalance: schema.accountBalances.finalBalance,
        })
        .from(schema.accountBalances)
        .where(
          and(
            eq(schema.accountBalances.accountingCyclesId, accountingCycleId),
            eq(schema.accountBalances.tenantId, tenantId),
            inArray(schema.accountBalances.accountPlanId, accountIds),
          ),
        );
    }

    const balanceMap = new Map(balances.map((b) => [b.accountPlanId, b]));

    // Get movements for these accounts
    const entryConditions: any[] = [
      eq(schema.accountingEntries.tenantId, tenantId),
      eq(schema.accountingEntries.status, 'POSTED'),
      inArray(schema.accountingEntryDetails.accountPlanId, accountIds),
    ];

    if (accountingCycleId) {
      entryConditions.push(
        eq(schema.accountingEntries.accountingCycleId, accountingCycleId),
      );
    }
    if (startDate) {
      entryConditions.push(gte(schema.accountingEntries.entryDate, startDate));
    }
    if (endDate) {
      entryConditions.push(lte(schema.accountingEntries.entryDate, endDate));
    }

    let movements: any[] = [];
    if (accountIds.length > 0) {
      movements = await this.drizzle
        .select({
          accountPlanId: schema.accountingEntryDetails.accountPlanId,
          entryId: schema.accountingEntries.id,
          entryDate: schema.accountingEntries.entryDate,
          description: schema.accountingEntries.description,
          originType: schema.accountingEntries.originType,
          debit: schema.accountingEntryDetails.debit,
          credit: schema.accountingEntryDetails.credit,
        })
        .from(schema.accountingEntryDetails)
        .innerJoin(
          schema.accountingEntries,
          eq(
            schema.accountingEntryDetails.accountingEntryId,
            schema.accountingEntries.id,
          ),
        )
        .where(and(...entryConditions))
        .orderBy(asc(schema.accountingEntries.entryDate));
    }

    const movementsByAccount = new Map<string, any[]>();
    for (const m of movements) {
      const key = m.accountPlanId;
      if (!movementsByAccount.has(key)) movementsByAccount.set(key, []);
      movementsByAccount.get(key)!.push(m);
    }

    const data = accounts.map((account) => {
      const bal = balanceMap.get(account.id);
      const initialBalance = bal?.initialBalance ?? '0.00';
      const accountMovements = movementsByAccount.get(account.id) || [];
      const isDebitNature = account.nature === 'DEBIT';

      // La carga inicial ya está reflejada en account_balances.initial_balance,
      // pero también existe como asiento POSTED. Si el asiento cae dentro del
      // rango consultado, se descuenta del saldo de apertura para no contarlo
      // dos veces; la fila de la carga inicial queda visible y arranca desde 0.
      const initialLoadNet = accountMovements.reduce((sum, m) => {
        const origin = String(m.originType ?? '').toUpperCase();
        const description = String(m.description ?? '').toUpperCase();
        const isInitialLoad =
          origin === 'INITIAL_LOAD' || description.includes('CARGA INICIAL');
        if (!isInitialLoad) return sum;

        const debit = parseFloat(m.debit) || 0;
        const credit = parseFloat(m.credit) || 0;
        return sum + (isDebitNature ? debit - credit : credit - debit);
      }, 0);

      const initialBalanceValue = parseFloat(initialBalance) || 0;
      const openingBalance =
        initialLoadNet !== 0 &&
        Math.abs(initialBalanceValue - initialLoadNet) < 0.01
          ? 0
          : initialBalanceValue;

      let runningBalance = openingBalance;
      const entries = accountMovements.map((m) => {
        const debit = parseFloat(m.debit) || 0;
        const credit = parseFloat(m.credit) || 0;
        runningBalance += isDebitNature ? debit - credit : credit - debit;
        return {
          entryId: m.entryId,
          entryDate: m.entryDate,
          description: m.description,
          originType: m.originType,
          debit: m.debit,
          credit: m.credit,
          balance: runningBalance.toFixed(6),
        };
      });

      const totalDebit = accountMovements
        .reduce((sum, m) => sum + (parseFloat(m.debit) || 0), 0)
        .toFixed(6);
      const totalCredit = accountMovements
        .reduce((sum, m) => sum + (parseFloat(m.credit) || 0), 0)
        .toFixed(6);
      const finalBalance = runningBalance.toFixed(6);

      return {
        accountPlanId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountNature: account.nature,
        initialBalance: openingBalance.toFixed(6),
        totalDebit,
        totalCredit,
        finalBalance,
        entries,
      };
    });

    return {
      data,
      meta: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPreviousPage: page > 1,
        nextPage: page * limit < totalCount ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      },
    };
  }

  async generatePdf(tenantId: string, filters: GeneralLedgerDto) {
    const { data } = await this.getData(tenantId, {
      ...filters,
      page: 1,
      limit: 10000,
    });

    const content = buildGeneralLedgerTableContent(data);
    const dateLabel = this.buildFilterDateLabel(
      filters.startDate,
      filters.endDate,
    );

    return this.pdfService.generateReport('LIBRO MAYOR', content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
      tenantId,
      subtitle: dateLabel,
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
