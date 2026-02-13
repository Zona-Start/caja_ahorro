import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { activeAccountBalancesView } from '@/database/schema/views/accounting';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, gte, lte, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { FilterBalanceSheetDto } from './dto/filter-balance-sheet.dto';
import { FilterGeneralLedgerDto } from './dto/filter-general-ledger.dto';
import { FilterIncomeStatementDto } from './dto/filter-income-statement.dto';
import { FilterJournalBookDto } from './dto/filter-journal-book.dto';
import { FilterTrialBalanceDto } from './dto/filter-trial-balance.dto';
import {
  BalanceSheetAccount,
  BalanceSheetResponse,
} from './entities/balance-sheet.entity';
import {
  GeneralLedgerAccount,
  GeneralLedgerEntry,
  GeneralLedgerResponse,
} from './entities/general-ledger.entity';
import { IncomeStatementResponse } from './entities/income-statement.entity';
import {
  JournalBookDetail,
  JournalBookEntry,
  JournalBookResponse,
} from './entities/journal-book.entity';
import {
  TrialBalanceAccount,
  TrialBalanceResponse,
} from './entities/trial-balance.entity';

@Injectable()
export class AccountingReportsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * LIBRO DIARIO (Journal Book)
   * Muestra todos los asientos contables en orden cronológico
   */
  async getJournalBook(
    dto: FilterJournalBookDto,
  ): Promise<JournalBookResponse> {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'entryDate',
      sortOrder = 'desc',
      accountingCycleId,
      companyId,
      startDate,
      endDate,
      status,
      originType,
    } = dto;

    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: SQL<unknown>[] = [];

    if (accountingCycleId) {
      conditions.push(
        eq(
          schema.accountingEntries.accountingCycleId,
          Number(accountingCycleId),
        ),
      );
    }

    if (companyId) {
      conditions.push(
        eq(schema.accountingEntries.companyId, Number(companyId)),
      );
    }

    if (startDate) {
      conditions.push(gte(schema.accountingEntries.entryDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(schema.accountingEntries.entryDate, endDate));
    }

    if (status) {
      conditions.push(eq(schema.accountingEntries.status, status as any));
    }

    if (originType) {
      conditions.push(eq(schema.accountingEntries.originType, originType));
    }

    if (search) {
      conditions.push(
        or(
          sql`${schema.accountingEntries.description} ILIKE ${`%${search}%`}`,
          sql`${schema.accountingEntries.originReferenceId} ILIKE ${`%${search}%`}`,
        )!,
      );
    }

    const whereCondition = conditions.length ? and(...conditions) : undefined;

    // Count total entries
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.accountingEntries)
      .where(whereCondition ?? sql`true`);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Sort mapping
    let orderBy: SQL<unknown>;
    if (sortBy === 'entryDate') {
      orderBy =
        sortOrder === 'asc'
          ? asc(schema.accountingEntries.entryDate)
          : desc(schema.accountingEntries.entryDate);
    } else {
      orderBy = desc(schema.accountingEntries.id);
    }

    // Fetch entries
    const entries = await this.drizzle
      .select({
        id: schema.accountingEntries.id,
        entryDate: schema.accountingEntries.entryDate,
        description: schema.accountingEntries.description,
        originType: schema.accountingEntries.originType,
        originReferenceId: schema.accountingEntries.originReferenceId,
        status: schema.accountingEntries.status,
      })
      .from(schema.accountingEntries)
      .where(whereCondition ?? sql`true`)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Fetch details for each entry
    const data: JournalBookEntry[] = await Promise.all(
      entries.map(async (entry) => {
        const details = await this.drizzle
          .select({
            detailId: schema.accountingEntryDetails.id,
            accountCode: schema.accountPlan.code,
            accountName: schema.accountPlan.name,
            description: schema.accountingEntryDetails.description,
            debit: schema.accountingEntryDetails.debit,
            credit: schema.accountingEntryDetails.credit,
          })
          .from(schema.accountingEntryDetails)
          .innerJoin(
            schema.accountPlan,
            eq(
              schema.accountingEntryDetails.accountPlanId,
              schema.accountPlan.id,
            ),
          )
          .where(eq(schema.accountingEntryDetails.accountingEntryId, entry.id))
          .orderBy(asc(schema.accountingEntryDetails.id));

        const totalDebit = details.reduce((sum, d) => sum + Number(d.debit), 0);
        const totalCredit = details.reduce(
          (sum, d) => sum + Number(d.credit),
          0,
        );

        return {
          entryId: entry.id,
          entryDate: entry.entryDate,
          description: entry.description,
          originType: entry.originType,
          originReferenceId: entry.originReferenceId,
          status: entry.status,
          details: details as JournalBookDetail[],
          totalDebit: totalDebit.toFixed(2),
          totalCredit: totalCredit.toFixed(2),
        };
      }),
    );

    return {
      data,
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      },
    };
  }

  /**
   * LIBRO MAYOR (General Ledger)
   * Muestra los movimientos de una o varias cuentas específicas
   */
  async getGeneralLedger(
    dto: FilterGeneralLedgerDto,
  ): Promise<GeneralLedgerResponse> {
    const {
      page = 1,
      limit = 10,
      accountingCycleId,
      companyId,
      accountPlanId,
      accountCode,
      startDate,
      endDate,
    } = dto;

    if (!accountingCycleId) {
      throw new BadRequestException('accountingCycleId is required');
    }

    const offset = (page - 1) * limit;

    // Build account filter
    const accountConditions: SQL<unknown>[] = [];

    if (companyId) {
      accountConditions.push(
        eq(schema.accountPlan.companyId, Number(companyId)),
      );
    }

    if (accountPlanId) {
      accountConditions.push(eq(schema.accountPlan.id, Number(accountPlanId)));
    }

    if (accountCode) {
      accountConditions.push(
        sql`${schema.accountPlan.code} ILIKE ${`%${accountCode}%`}`,
      );
    }

    // Only accounts that allow movements
    accountConditions.push(eq(schema.accountPlan.allowsMovements, true));

    const accountWhere = accountConditions.length
      ? and(...accountConditions)
      : undefined;

    // Count total accounts
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.accountPlan)
      .where(accountWhere ?? sql`true`);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch accounts
    const accounts = await this.drizzle
      .select({
        id: schema.accountPlan.id,
        code: schema.accountPlan.code,
        name: schema.accountPlan.name,
        nature: schema.accountPlan.nature,
      })
      .from(schema.accountPlan)
      .where(accountWhere ?? sql`true`)
      .orderBy(asc(schema.accountPlan.code))
      .limit(limit)
      .offset(offset);

    // For each account, get balance and movements
    const data: GeneralLedgerAccount[] = await Promise.all(
      accounts.map(async (account) => {
        // Get initial balance from account_balances
        const [balanceInfo] = await this.drizzle
          .select({
            initialBalance: schema.accountBalances.initialBalance,
          })
          .from(schema.accountBalances)
          .where(
            and(
              eq(schema.accountBalances.accountPlanId, account.id),
              eq(
                schema.accountBalances.accountingCyclesId,
                Number(accountingCycleId),
              ),
            ),
          )
          .limit(1);

        const initialBalance = balanceInfo?.initialBalance ?? '0.00';

        // Get movements
        const movementConditions: SQL<unknown>[] = [
          eq(schema.accountingEntryDetails.accountPlanId, account.id),
          eq(
            schema.accountingEntries.accountingCycleId,
            Number(accountingCycleId),
          ),
          eq(schema.accountingEntries.status, 'POSTED'),
        ];

        if (startDate) {
          movementConditions.push(
            gte(schema.accountingEntries.entryDate, startDate),
          );
        }

        if (endDate) {
          movementConditions.push(
            lte(schema.accountingEntries.entryDate, endDate),
          );
        }

        const movements = await this.drizzle
          .select({
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
          .where(and(...movementConditions))
          .orderBy(asc(schema.accountingEntries.entryDate));

        // Calculate running balance
        let runningBalance = Number(initialBalance);
        const entries: GeneralLedgerEntry[] = movements.map((mov) => {
          const debit = Number(mov.debit);
          const credit = Number(mov.credit);

          // Update balance based on account nature
          if (account.nature === 'DEBIT') {
            runningBalance += debit - credit;
          } else {
            runningBalance += credit - debit;
          }

          return {
            entryId: mov.entryId,
            entryDate: mov.entryDate,
            description: mov.description,
            originType: mov.originType,
            debit: mov.debit,
            credit: mov.credit,
            balance: runningBalance.toFixed(2),
          };
        });

        const totalDebit = movements.reduce(
          (sum, m) => sum + Number(m.debit),
          0,
        );
        const totalCredit = movements.reduce(
          (sum, m) => sum + Number(m.credit),
          0,
        );

        return {
          accountPlanId: account.id,
          accountCode: account.code,
          accountName: account.name,
          accountNature: account.nature,
          initialBalance,
          totalDebit: totalDebit.toFixed(2),
          totalCredit: totalCredit.toFixed(2),
          finalBalance: runningBalance.toFixed(2),
          entries,
        };
      }),
    );

    return {
      data,
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      },
    };
  }

  /**
   * BALANCE DE COMPROBACIÓN (Trial Balance)
   * Muestra saldos iniciales, movimientos y saldos finales de todas las cuentas
   */
  async getTrialBalance(
    dto: FilterTrialBalanceDto,
  ): Promise<TrialBalanceResponse> {
    const { accountingCycleId, companyId, level, onlyWithMovements } = dto;

    if (!accountingCycleId) {
      throw new BadRequestException('accountingCycleId is required');
    }

    // Get cycle info
    const cycle = await this.drizzle.query.accountingCycles.findFirst({
      where: eq(schema.accountingCycles.id, Number(accountingCycleId)),
    });

    if (!cycle) {
      throw new NotFoundException('Accounting cycle not found');
    }

    // Use the optimized view
    const conditions: SQL<unknown>[] = [
      eq(
        activeAccountBalancesView.accountingCycleId,
        Number(accountingCycleId),
      ),
    ];

    if (companyId) {
      conditions.push(
        eq(activeAccountBalancesView.companyId, Number(companyId)),
      );
    }

    // Get accounts with balances
    const balancesData = await this.drizzle
      .select({
        accountPlanId: activeAccountBalancesView.accountPlanId,
        accountCode: activeAccountBalancesView.accountCode,
        accountName: activeAccountBalancesView.accountName,
        nature: activeAccountBalancesView.nature,
        initialBalance: activeAccountBalancesView.initialBalance,
        periodDebit: activeAccountBalancesView.periodDebit,
        periodCredit: activeAccountBalancesView.periodCredit,
        currentBalance: activeAccountBalancesView.currentBalance,
        accountType: schema.accountPlan.accountType,
        level: schema.accountPlan.level,
      })
      .from(activeAccountBalancesView)
      .innerJoin(
        schema.accountPlan,
        eq(activeAccountBalancesView.accountPlanId, schema.accountPlan.id),
      )
      .where(and(...conditions))
      .orderBy(asc(activeAccountBalancesView.accountCode));

    // Filter by level if specified
    let filteredData = balancesData;
    if (level) {
      filteredData = balancesData.filter((b) => b.level === Number(level));
    }

    // Filter only with movements if specified
    if (onlyWithMovements === 'true') {
      filteredData = filteredData.filter(
        (b) => Number(b.periodDebit) > 0 || Number(b.periodCredit) > 0,
      );
    }

    const accounts: TrialBalanceAccount[] = filteredData.map((b) => ({
      accountPlanId: b.accountPlanId,
      accountCode: b.accountCode,
      accountName: b.accountName,
      accountType: b.accountType,
      accountNature: b.nature,
      level: b.level,
      initialBalance: b.initialBalance,
      periodDebit: b.periodDebit,
      periodCredit: b.periodCredit,
      currentBalance: b.currentBalance,
    }));

    // Calculate totals
    const summary = {
      totalInitialDebit: filteredData
        .reduce((sum, b) => {
          const bal = Number(b.initialBalance);
          return sum + (bal > 0 ? bal : 0);
        }, 0)
        .toFixed(2),
      totalInitialCredit: filteredData
        .reduce((sum, b) => {
          const bal = Number(b.initialBalance);
          return sum + (bal < 0 ? Math.abs(bal) : 0);
        }, 0)
        .toFixed(2),
      totalPeriodDebit: filteredData
        .reduce((sum, b) => sum + Number(b.periodDebit), 0)
        .toFixed(2),
      totalPeriodCredit: filteredData
        .reduce((sum, b) => sum + Number(b.periodCredit), 0)
        .toFixed(2),
      totalCurrentDebit: filteredData
        .reduce((sum, b) => {
          const bal = Number(b.currentBalance);
          return sum + (bal > 0 ? bal : 0);
        }, 0)
        .toFixed(2),
      totalCurrentCredit: filteredData
        .reduce((sum, b) => {
          const bal = Number(b.currentBalance);
          return sum + (bal < 0 ? Math.abs(bal) : 0);
        }, 0)
        .toFixed(2),
    };

    return {
      accounts,
      summary,
      cycleInfo: {
        cycleId: cycle.id,
        description: cycle.description,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        status: cycle.status,
      },
    };
  }

  /**
   * BALANCE GENERAL (Balance Sheet)
   * Muestra Activos, Pasivos y Patrimonio
   */
  async getBalanceSheet(
    dto: FilterBalanceSheetDto,
  ): Promise<BalanceSheetResponse> {
    const { accountingCycleId, companyId, detailLevel = '2' } = dto;

    if (!accountingCycleId) {
      throw new BadRequestException('accountingCycleId is required');
    }

    // Get cycle info
    const cycle = await this.drizzle.query.accountingCycles.findFirst({
      where: eq(schema.accountingCycles.id, Number(accountingCycleId)),
    });

    if (!cycle) {
      throw new NotFoundException('Accounting cycle not found');
    }

    const conditions: SQL<unknown>[] = [
      eq(
        activeAccountBalancesView.accountingCycleId,
        Number(accountingCycleId),
      ),
    ];

    if (companyId) {
      conditions.push(
        eq(activeAccountBalancesView.companyId, Number(companyId)),
      );
    }

    // Get all balances
    const balancesData = await this.drizzle
      .select({
        accountPlanId: activeAccountBalancesView.accountPlanId,
        accountCode: activeAccountBalancesView.accountCode,
        accountName: activeAccountBalancesView.accountName,
        currentBalance: activeAccountBalancesView.currentBalance,
        accountType: schema.accountPlan.accountType,
        level: schema.accountPlan.level,
        parentAccountId: schema.accountPlan.parentAccountId,
      })
      .from(activeAccountBalancesView)
      .innerJoin(
        schema.accountPlan,
        eq(activeAccountBalancesView.accountPlanId, schema.accountPlan.id),
      )
      .where(and(...conditions))
      .orderBy(asc(activeAccountBalancesView.accountCode));

    const maxLevel = Number(detailLevel);

    // Filter by detail level
    const filteredData = balancesData.filter((b) => b.level <= maxLevel);

    // Separate by account type
    const assets = filteredData.filter((b) => b.accountType === 'ASSET');
    const liabilities = filteredData.filter(
      (b) => b.accountType === 'LIABILITY',
    );
    const equity = filteredData.filter((b) => b.accountType === 'EQUITY');

    const buildHierarchy = (
      items: typeof filteredData,
    ): BalanceSheetAccount[] => {
      return items.map((item) => ({
        accountPlanId: item.accountPlanId,
        accountCode: item.accountCode,
        accountName: item.accountName,
        level: item.level,
        balance: item.currentBalance,
      }));
    };

    const totalAssets = assets
      .reduce((sum, a) => sum + Number(a.currentBalance), 0)
      .toFixed(2);
    const totalLiabilities = liabilities
      .reduce((sum, l) => sum + Number(l.currentBalance), 0)
      .toFixed(2);
    const totalEquity = equity
      .reduce((sum, e) => sum + Number(e.currentBalance), 0)
      .toFixed(2);

    return {
      assets: {
        title: 'Activos',
        accounts: buildHierarchy(assets),
        total: totalAssets,
      },
      liabilities: {
        title: 'Pasivos',
        accounts: buildHierarchy(liabilities),
        total: totalLiabilities,
      },
      equity: {
        title: 'Patrimonio',
        accounts: buildHierarchy(equity),
        total: totalEquity,
      },
      totals: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalLiabilitiesAndEquity: (
          Number(totalLiabilities) + Number(totalEquity)
        ).toFixed(2),
      },
      cycleInfo: {
        cycleId: cycle.id,
        description: cycle.description,
        endDate: cycle.endDate,
      },
    };
  }

  /**
   * ESTADO DE RESULTADOS (Income Statement)
   * Muestra Ingresos y Gastos
   */
  async getIncomeStatement(
    dto: FilterIncomeStatementDto,
  ): Promise<IncomeStatementResponse> {
    const { accountingCycleId, companyId, detailLevel = '2' } = dto;

    if (!accountingCycleId) {
      throw new BadRequestException('accountingCycleId is required');
    }

    // Get cycle info
    const cycle = await this.drizzle.query.accountingCycles.findFirst({
      where: eq(schema.accountingCycles.id, Number(accountingCycleId)),
    });

    if (!cycle) {
      throw new NotFoundException('Accounting cycle not found');
    }

    const conditions: SQL<unknown>[] = [
      eq(
        activeAccountBalancesView.accountingCycleId,
        Number(accountingCycleId),
      ),
    ];

    if (companyId) {
      conditions.push(
        eq(activeAccountBalancesView.companyId, Number(companyId)),
      );
    }

    // Get all balances
    const balancesData = await this.drizzle
      .select({
        accountPlanId: activeAccountBalancesView.accountPlanId,
        accountCode: activeAccountBalancesView.accountCode,
        accountName: activeAccountBalancesView.accountName,
        currentBalance: activeAccountBalancesView.currentBalance,
        accountType: schema.accountPlan.accountType,
        level: schema.accountPlan.level,
      })
      .from(activeAccountBalancesView)
      .innerJoin(
        schema.accountPlan,
        eq(activeAccountBalancesView.accountPlanId, schema.accountPlan.id),
      )
      .where(and(...conditions))
      .orderBy(asc(activeAccountBalancesView.accountCode));

    const maxLevel = Number(detailLevel);
    const filteredData = balancesData.filter((b) => b.level <= maxLevel);

    // Separate revenue and expenses
    const revenue = filteredData.filter((b) => b.accountType === 'REVENUE');
    const expenses = filteredData.filter((b) => b.accountType === 'EXPENSE');

    const buildAccounts = (items: typeof filteredData) => {
      return items.map((item) => ({
        accountPlanId: item.accountPlanId,
        accountCode: item.accountCode,
        accountName: item.accountName,
        level: item.level,
        balance: item.currentBalance,
      }));
    };

    const totalRevenue = revenue
      .reduce((sum, r) => sum + Number(r.currentBalance), 0)
      .toFixed(2);
    const totalExpenses = expenses
      .reduce((sum, e) => sum + Number(e.currentBalance), 0)
      .toFixed(2);

    const netIncome = (Number(totalRevenue) - Number(totalExpenses)).toFixed(2);

    return {
      revenue: {
        title: 'Ingresos',
        accounts: buildAccounts(revenue),
        total: totalRevenue,
      },
      expenses: {
        title: 'Gastos',
        accounts: buildAccounts(expenses),
        total: totalExpenses,
      },
      result: {
        grossProfit: totalRevenue,
        operatingIncome: netIncome,
        netIncome,
      },
      cycleInfo: {
        cycleId: cycle.id,
        description: cycle.description,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
      },
    };
  }
}
