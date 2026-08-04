import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import {
  NewAccountBalance,
  NewAccountingEntry,
  NewAccountingEntryDetail,
} from '@/database/types/accounting';
import { AuditHelper } from '@/features/audit/audit-event.service';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, ilike, inArray, max, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/schema';
import { CloseCycleDto } from './dto/close-cycle.dto';
import { FilterAccountingBalanceDto } from './dto/filter-accounting-balance.dto';
import { InitialLoadDto } from './dto/initial-load.dto';
import { OpenCycleDto } from './dto/open-cycle.dto';
import { parseExcelFile } from './utils/excel-parser.util';

@Injectable()
export class AccountingBalanceService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) { }



  async bootstrapping(
    userId: string,
    tenantId: string,
    initialLoadDto: InitialLoadDto,
    file?: Express.Multer.File,
  ) {
    // 1. Obtener los datos (desde archivo o desde DTO)
    let rawBalances: any[] = [];
    if (file) {
      rawBalances = (await parseExcelFile(file.buffer)) as any[];
    } else {
      rawBalances = initialLoadDto.balances ?? [];
    }

    // 2. Agrupar por código de cuenta
    const groups = new Map<string, any[]>();
    for (const item of rawBalances) {
      const rawCode = item.accountCode ?? item.CUENTA ?? item.cuenta;
      const code = String(rawCode || '').trim();
      if (!code) continue;
      if (!groups.has(code)) groups.set(code, []);
      groups.get(code)!.push(item);
    }

    // 3. Calcular saldo total por cuenta (suma de auxiliares)
    const uniqueBalances: { accountCode: string; balance: number }[] = [];
    groups.forEach((rows, code) => {
      const hasAuxiliaries = rows.some((r) => {
        const aux = r.AUXILIAR ?? r.auxiliar ?? r.aux;
        return aux && String(aux).trim() !== '' && String(aux).trim() !== '000';
      });
      let finalRows = rows;
      if (hasAuxiliaries) {
        finalRows = rows.filter((r) => {
          const aux = r.AUXILIAR ?? r.auxiliar ?? r.aux;
          return aux && String(aux).trim() !== '' && String(aux).trim() !== '000';
        });
      }
      const totalBalance = finalRows.reduce((sum, row) => {
        const val =
          row.balance ??
          row.SALDO_ACTUAL ??
          row.saldo_actual ??
          row.SALDO ??
          row.saldo ??
          0;
        return sum + Number(val);
      }, 0);

      uniqueBalances.push({ accountCode: code, balance: totalBalance });
    });

    // 4. Validar ciclo contable activo
    const [activeCycle] = await this.drizzle
      .select()
      .from(schema.accountingCycles)
      .where(
        and(
          eq(schema.accountingCycles.status, 'OPEN'),
          eq(schema.accountingCycles.tenantId, tenantId),
        ),
      )
      .limit(1);
    if (!activeCycle)
      throw new NotFoundException('No active accounting cycle found.');

    // 5. Verificar que no haya saldos cargados
    const existing = await this.drizzle
      .select({ id: schema.accountBalances.id })
      .from(schema.accountBalances)
      .where(
        and(
          eq(schema.accountBalances.accountingCyclesId, activeCycle.id),
          eq(schema.accountBalances.tenantId, tenantId),
        ),
      )
      .limit(1);
    if (existing.length > 0)
      throw new BadRequestException('Balances already loaded.');

    // 6. Verificar que no existan asientos en el ciclo
    const entries = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.accountingEntries)
      .where(
        and(
          eq(schema.accountingEntries.accountingCycleId, activeCycle.id),
          eq(schema.accountingEntries.tenantId, tenantId),
        ),
      );
    if (Number(entries[0].count) > 0)
      throw new BadRequestException('Cycle has existing entries.');

    // 7. Obtener cuentas del plan
    const codes = uniqueBalances.map((b) => b.accountCode);
    const accountsFound = await this.drizzle
      .select({
        id: schema.accountPlan.id,
        code: schema.accountPlan.code,
        nature: schema.accountPlan.nature,
        accountType: schema.accountPlan.accountType, // ← AGREGADO: para segregar por tipo
        allowsMovements: schema.accountPlan.allowsMovements,
      })
      .from(schema.accountPlan)
      .where(
        and(
          eq(schema.accountPlan.tenantId, tenantId),
          inArray(schema.accountPlan.code, codes),
        ),
      );

    const accountMap = new Map(accountsFound.map((acc) => [acc.code, acc]));

    // Variables para acumular totales
    let totalDebits = 0;
    let totalCredits = 0;
    let totalAssets = 0;      // Suma de saldos de cuentas ASSET (con signo)
    let totalLiabilities = 0; // Suma de saldos de cuentas LIABILITY (con signo)
    let totalEquity = 0;      // Suma de saldos de cuentas EQUITY (con signo)

    const payloadToInsert: NewAccountBalance[] = [];

    // Arrays para auditar la data rechazada
    const missingAccounts: string[] = [];
    const parentAccountsWithBalance: string[] = [];

    // LOG: Inicializar un array para guardar el detalle de cada cuenta procesada
    const processingLog: string[] = [];


    for (const item of uniqueBalances) {
      const account = accountMap.get(item.accountCode);

      if (!account) {
        missingAccounts.push(item.accountCode);
        continue;
      }
      // if (!account.allowsMovements) {
      //   parentAccountsWithBalance.push(`${item.accountCode} (Saldo: ${item.balance})`);
      //   continue;
      // }

      const amount = Number(item.balance);

      // LOG: Registrar el procesamiento de esta cuenta
      const logEntry = `Cuenta: ${item.accountCode}, Monto: ${amount}, Naturaleza: ${account.nature}, Tipo: ${account.accountType}`;
      processingLog.push(logEntry);


      // ✅ ACUMULACIÓN POR NATURALEZA (para débitos/créditos)
      if (account.nature === 'DEBIT') {
        totalDebits += amount;
        processingLog.push(`  -> Sumado a DÉBITOS (total parcial: ${totalDebits.toFixed(2)})`);
      } else { // CREDIT
        totalCredits += amount;
        processingLog.push(`  -> Sumado a CRÉDITOS (total parcial: ${totalCredits.toFixed(2)})`);
      }

      // ✅ ACUMULACIÓN POR TIPO DE CUENTA (Activo, Pasivo, Patrimonio)
      if (account.accountType === 'ASSET') {
        totalAssets += amount;
        processingLog.push(`  -> Sumado a ACTIVOS (total parcial: ${totalAssets.toFixed(2)})`);
      } else if (account.accountType === 'LIABILITY') {
        totalLiabilities += amount;
        processingLog.push(`  -> Sumado a PASIVOS (total parcial: ${totalLiabilities.toFixed(2)})`);
      } else if (account.accountType === 'EQUITY') {
        totalEquity += amount;
        processingLog.push(`  -> Sumado a PATRIMONIO (total parcial: ${totalEquity.toFixed(2)})`);
      }

      // ✅ ALMACENAMIENTO: SIEMPRE VALOR ABSOLUTO
      const balanceToStore = Math.abs(amount);

      payloadToInsert.push({
        tenantId,
        accountPlanId: String(account.id),
        accountingCyclesId: activeCycle.id,
        initialBalance: String(balanceToStore),
        debitBalance: '0.00',
        creditBalance: '0.00',
        finalBalance: String(balanceToStore),
        createdById: userId,
        updatedById: userId,
      });
    }



    // 7.5 Lanzar error temprano si hay cuentas inválidas en el Excel
    if (missingAccounts.length > 0 || parentAccountsWithBalance.length > 0) {
      const errorMsg = `Carga detenida. Cuentas no existen en BD: [${missingAccounts.join(', ')}]. Cuentas PADRE con saldo directo en Excel (no permitido): [${parentAccountsWithBalance.join(', ')}].`;
      console.log(errorMsg);
      console.log('Log de procesamiento:');
      console.log(processingLog.join('\n'));
      throw new BadRequestException(errorMsg);
    }

    // 8. Validar balance: la suma de débitos y créditos (con signo) debe ser 0
    const diff = Math.abs(totalDebits + totalCredits);

    // =========================================
    // REPORTE CONTABLE DE VALIDACIÓN
    // =========================================

    let totalRevenue = 0;
    let totalExpense = 0;

    const accountSummary: {
      code: string;
      type: string;
      nature: string;
      amount: number;
    }[] = [];

    for (const item of uniqueBalances) {
      const account = accountMap.get(item.accountCode);
      if (!account) continue;

      const amount = Number(item.balance);

      accountSummary.push({
        code: item.accountCode,
        type: account.accountType,
        nature: account.nature,
        amount,
      });

      switch (account.accountType) {
        case 'REVENUE':
          totalRevenue += amount;
          break;

        case 'EXPENSE':
          totalExpense += amount;
          break;
      }
    }

    // Activos ya fueron calculados
    // Pasivos ya fueron calculados
    // Patrimonio ya fue calculado

    const assets = totalAssets;
    const liabilities = totalLiabilities;
    const equity = totalEquity;
    const revenues = totalRevenue;
    const expenses = totalExpense;

    const debitTotal = totalDebits;
    const creditTotal = totalCredits;

    const accountingEquation =
      assets + liabilities + equity;

    console.log(`
  ==============================================================
               REPORTE DE VALIDACIÓN CONTABLE
  ==============================================================

  ACTIVOS      : ${assets.toFixed(2)}

  PASIVOS      : ${Math.abs(liabilities).toFixed(2)}

  PATRIMONIO   : ${Math.abs(equity).toFixed(2)}

  INGRESOS     : ${Math.abs(revenues).toFixed(2)}

  GASTOS       : ${expenses.toFixed(2)}

  --------------------------------------------------------------

  TOTAL DEBE   : ${debitTotal.toFixed(2)}

  TOTAL HABER  : ${Math.abs(creditTotal).toFixed(2)}

  DIFERENCIA   : ${(debitTotal + creditTotal).toFixed(2)}

  --------------------------------------------------------------

  ACTIVO =
  ${assets.toFixed(2)}

  PASIVO + PATRIMONIO =
  ${Math.abs(liabilities + equity).toFixed(2)}

  DIFERENCIA ECUACIÓN =
  ${(assets + liabilities + equity).toFixed(2)}

  --------------------------------------------------------------

  UTILIDAD DEL EJERCICIO

  Ingresos : ${Math.abs(revenues).toFixed(2)}

  Gastos   : ${expenses.toFixed(2)}

  Resultado:
  ${(revenues + expenses).toFixed(2)}

  ==============================================================
  `);

    console.log("\n=========== TOP CUENTAS POR MONTO ==========");

    accountSummary
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .forEach(a => {

        console.log(
          `${a.code.padEnd(20)} | ${a.type.padEnd(10)} | ${a.nature.padEnd(6)} | ${a.amount.toFixed(2)}`
        );

      });


    if (diff > 1.0) {
      const errorMsg = `Initial Load Imbalance. Total Debits (signed): ${totalDebits.toFixed(2)}, Total Credits (signed): ${totalCredits.toFixed(2)}. Difference: ${diff.toFixed(2)}. 
      === Resumen por tipo de cuenta ===
      Detalle de procesamiento: 
      ${processingLog.join('\n')}`;
      console.log(errorMsg);
      throw new ConflictException(errorMsg);
    }

    // 9. Transacción
    return this.drizzle.transaction(async (tx) => {
      if (payloadToInsert.length > 0) {
        await tx.insert(schema.accountBalances).values(payloadToInsert);
      }

      await this.auditHelper.logCreate(
        tenantId,
        'accountBalances',
        payloadToInsert[0],
        {
          targetId: payloadToInsert[0].id,
          description: `Initial balances loaded successfully. Total registered: ${payloadToInsert.length} accounts.`,
        },
      );
      return { message: 'Success', processedAccounts: payloadToInsert.length };
    });
  }




  async closeCycle(
    userId: string,
    tenantId: string,
    cycleId: string,
    dto: CloseCycleDto,
  ) {
    const { isFiscalYearEnd } = dto;

    const [cycle] = await this.drizzle
      .select()
      .from(schema.accountingCycles)
      .where(
        and(
          eq(schema.accountingCycles.id, cycleId),
          eq(schema.accountingCycles.tenantId, tenantId),
        ),
      );

    if (!cycle) throw new NotFoundException('Cycle not found');
    if (cycle.status !== 'OPEN')
      throw new BadRequestException('Cycle is not OPEN');

    const pendingEntries = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.accountingEntries)
      .where(
        and(
          eq(schema.accountingEntries.accountingCycleId, cycleId),
          eq(schema.accountingEntries.tenantId, tenantId),
          inArray(schema.accountingEntries.status, ['DRAFT', 'PENDING']),
        ),
      );

    if (Number(pendingEntries[0].count) > 0)
      throw new BadRequestException(
        'Cannot close cycle with DRAFT or PENDING entries.',
      );

    const balancesExist = await this.drizzle
      .select({ id: schema.accountBalances.id })
      .from(schema.accountBalances)
      .where(
        and(
          eq(schema.accountBalances.accountingCyclesId, cycleId),
          eq(schema.accountBalances.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (balancesExist.length === 0)
      throw new BadRequestException(
        'Cannot close cycle without loaded balances. Perform initial load (bootstrapping) first.',
      );

    return this.drizzle.transaction(async (tx) => {
      // 1. Agregar débitos y créditos desde accountingEntryDetails (solo POSTED)
      const movementAgg = await tx
        .select({
          accountPlanId: schema.accountingEntryDetails.accountPlanId,
          totalDebit: sql<string>`COALESCE(SUM(${schema.accountingEntryDetails.debit}), 0)::text`,
          totalCredit: sql<string>`COALESCE(SUM(${schema.accountingEntryDetails.credit}), 0)::text`,
        })
        .from(schema.accountingEntryDetails)
        .innerJoin(
          schema.accountingEntries,
          and(
            eq(
              schema.accountingEntryDetails.accountingEntryId,
              schema.accountingEntries.id,
            ),
            eq(schema.accountingEntries.accountingCycleId, cycleId),
            eq(schema.accountingEntries.tenantId, tenantId),
            eq(schema.accountingEntries.status, 'POSTED'),
          ),
        )
        .groupBy(schema.accountingEntryDetails.accountPlanId);

      const movementMap = new Map(
        movementAgg.map((m) => [m.accountPlanId, m]),
      );

      // 2. Obtener todas las cuentas del plan (para actualizar incluso cuentas sin movimientos)
      const allAccounts = await tx.query.accountPlan.findMany({
        where: eq(schema.accountPlan.tenantId, tenantId),
        columns: {
          id: true,
          code: true,
          name: true,
          accountType: true,
          nature: true,
          allowsMovements: true,
        },
      });

      const accountMap = new Map(allAccounts.map((a) => [a.id, a]));

      // 3. Obtener balances existentes
      const existingBalances = await tx.query.accountBalances.findMany({
        where: and(
          eq(schema.accountBalances.accountingCyclesId, cycleId),
          eq(schema.accountBalances.tenantId, tenantId),
        ),
      });

      const balanceMap = new Map(
        existingBalances.map((b) => [b.accountPlanId, b]),
      );

      // 4. Calcular y actualizar finalBalance para cada cuenta
      const finalBalancesMap = new Map<
        string,
        {
          initialBalance: string;
          debitBalance: string;
          creditBalance: string;
          finalBalance: string;
        }
      >();

      for (const account of allAccounts) {
        if (!account.allowsMovements) continue;

        const existingBalance = balanceMap.get(account.id);
        const movements = movementMap.get(account.id);

        const initialBalance = existingBalance?.initialBalance ?? '0.00';
        const debitBalance = movements?.totalDebit ?? '0.00';
        const creditBalance = movements?.totalCredit ?? '0.00';

        const initNum = parseFloat(initialBalance);
        const debitNum = parseFloat(debitBalance);
        const creditNum = parseFloat(creditBalance);

        const finalBalance = (initNum + debitNum - creditNum).toFixed(6);

        finalBalancesMap.set(account.id, {
          initialBalance,
          debitBalance,
          creditBalance,
          finalBalance,
        });

        if (existingBalance) {
          await tx
            .update(schema.accountBalances)
            .set({
              debitBalance,
              creditBalance,
              finalBalance,
              updatedById: userId,
            })
            .where(
              and(
                eq(schema.accountBalances.id, existingBalance.id),
                eq(schema.accountBalances.tenantId, tenantId),
              ),
            );
        } else {
          await tx.insert(schema.accountBalances).values({
            tenantId,
            accountPlanId: account.id,
            accountingCyclesId: cycleId,
            initialBalance,
            debitBalance,
            creditBalance,
            finalBalance,
            createdById: userId,
            updatedById: userId,
          });
        }
      }

      // 5. Cierre fiscal: generar asiento de cierre (ingresos/gastos -> patrimonio)
      let closingEntryId: string | null = null;
      if (isFiscalYearEnd) {
        closingEntryId = await this.generateFiscalClosingEntry(
          tx,
          userId,
          tenantId,
          cycleId,
          accountMap,
          finalBalancesMap,
        );
      }

      // 6. Marcar ciclo como CLOSED
      await tx
        .update(schema.accountingCycles)
        .set({
          status: 'CLOSED',
          closedAt: new Date(),
          closedByUser_id: userId,
        })
        .where(
          and(
            eq(schema.accountingCycles.id, cycleId),
            eq(schema.accountingCycles.tenantId, tenantId),
          ),
        );

      await this.auditHelper.logCreate(tenantId, 'accountingCycles', cycle, {
        targetId: cycleId,
        description: `Cycle ${cycleId} closed${isFiscalYearEnd ? ' (fiscal year-end)' : ''}. ${closingEntryId ? `Closing entry created: ${closingEntryId}` : ''}`,
      });

      return {
        message: `Cycle closed successfully${isFiscalYearEnd ? ' (fiscal year-end)' : ''}`,
        closingEntryId,
      };
    });
  }

  private async generateFiscalClosingEntry(
    tx: NodePgDatabase<typeof schema>,
    userId: string,
    tenantId: string,
    cycleId: string,
    accountMap: Map<string, { id: string; code: string; name: string; accountType: string; nature: string; allowsMovements: boolean }>,
    finalBalancesMap: Map<
      string,
      {
        initialBalance: string;
        debitBalance: string;
        creditBalance: string;
        finalBalance: string;
      }
    >,
  ): Promise<string> {
    // Agrupar cuentas de resultado con saldo != 0
    const revenueAccounts: { id: string; code: string; name: string; balance: number }[] = [];
    const expenseAccounts: { id: string; code: string; name: string; balance: number }[] = [];

    for (const [accountId, account] of accountMap) {
      if (!account.allowsMovements) continue;
      const balance = finalBalancesMap.get(accountId);
      if (!balance) continue;

      const finalBalanceNum = parseFloat(balance.finalBalance);

      if (account.accountType === 'REVENUE' && Math.abs(finalBalanceNum) > 0.000001) {
        revenueAccounts.push({
          id: accountId,
          code: account.code,
          name: account.name,
          balance: finalBalanceNum,
        });
      } else if (account.accountType === 'EXPENSE' && Math.abs(finalBalanceNum) > 0.000001) {
        expenseAccounts.push({
          id: accountId,
          code: account.code,
          name: account.name,
          balance: finalBalanceNum,
        });
      }
    }

    if (revenueAccounts.length === 0 && expenseAccounts.length === 0) {
      return '';
    }

    // Buscar cuenta de patrimonio para el resultado del ejercicio
    let resultAccount = [...accountMap.values()]
      .find(
        (a) =>
          a.accountType === 'EQUITY' &&
          a.allowsMovements &&
          (a.name.toLowerCase().includes('resultado') ||
            a.name.toLowerCase().includes('excedente') ||
            a.name.toLowerCase().includes('pérdida') ||
            a.name.toLowerCase().includes('perdida')),
      );

    if (!resultAccount) {
      resultAccount = [...accountMap.values()].find(
        (a) =>
          a.accountType === 'EQUITY' && a.allowsMovements,
      );
    }

    if (!resultAccount) {
      throw new BadRequestException(
        'No equity result account found for fiscal year-end closing. Please create an EQUITY account that allows movements.',
      );
    }

    // Obtener siguiente número de comprobante
    const voucherNo = await this.getNextVoucherNo(tenantId, userId, tx);

    // Crear cabecera del asiento de cierre
    const closingDescription = `Asiento de Cierre Fiscal - ${new Date().getFullYear()}`;
    const [entry] = await tx
      .insert(schema.accountingEntries)
      .values({
        tenantId,
        accountingCycleId: cycleId,
        entryDate: new Date().toISOString().split('T')[0],
        description: closingDescription,
        voucherNo,
        originType: 'FISCAL_CLOSING',
        status: 'POSTED',
        postedAt: new Date(),
        currencyCode: 'USD',
      })
      .returning({ id: schema.accountingEntries.id });

    const closingEntryId = entry.id;

    const details: NewAccountingEntryDetail[] = [];

    // REVENUE: CREDIT nature, saldo negativo => DEBIT para llevarlo a cero
    for (const account of revenueAccounts) {
      const amount = Math.abs(account.balance).toFixed(6);
      details.push({
        accountingEntryId: closingEntryId,
        accountPlanId: account.id,
        debit: amount,
        credit: '0.00',
        description: `Cierre fiscal: ${account.code} - ${account.name}`,
      });
    }

    // EXPENSE: DEBIT nature, saldo positivo => CREDIT para llevarlo a cero
    for (const account of expenseAccounts) {
      const amount = account.balance.toFixed(6);
      details.push({
        accountingEntryId: closingEntryId,
        accountPlanId: account.id,
        debit: '0.00',
        credit: amount,
        description: `Cierre fiscal: ${account.code} - ${account.name}`,
      });
    }

    // Calcular resultado neto
    const totalRevenue = revenueAccounts.reduce(
      (sum, a) => sum + Math.abs(a.balance),
      0,
    );
    const totalExpense = expenseAccounts.reduce(
      (sum, a) => sum + a.balance,
      0,
    );
    const netResult = totalRevenue - totalExpense;

    if (Math.abs(netResult) > 0.000001) {
      if (netResult > 0) {
        // Utilidad => CREDIT a patrimonio
        details.push({
          accountingEntryId: closingEntryId,
          accountPlanId: resultAccount.id,
          debit: '0.00',
          credit: netResult.toFixed(6),
          description: `Resultado del ejercicio (Utilidad): ${resultAccount.code} - ${resultAccount.name}`,
        });
      } else {
        // Pérdida => DEBIT a patrimonio
        details.push({
          accountingEntryId: closingEntryId,
          accountPlanId: resultAccount.id,
          debit: Math.abs(netResult).toFixed(6),
          credit: '0.00',
          description: `Resultado del ejercicio (Pérdida): ${resultAccount.code} - ${resultAccount.name}`,
        });
      }
    }

    if (details.length > 0) {
      await tx.insert(schema.accountingEntryDetails).values(details);

      // Recalcular finalBalance para las cuentas afectadas por el cierre
      const affectedAccountIds = details.map((d) => d.accountPlanId!);
      for (const accountId of affectedAccountIds) {
        const [reAgg] = await tx
          .select({
            totalDebit: sql<string>`COALESCE(SUM(${schema.accountingEntryDetails.debit}), 0)::text`,
            totalCredit: sql<string>`COALESCE(SUM(${schema.accountingEntryDetails.credit}), 0)::text`,
          })
          .from(schema.accountingEntryDetails)
          .innerJoin(
            schema.accountingEntries,
            and(
              eq(
                schema.accountingEntryDetails.accountingEntryId,
                schema.accountingEntries.id,
              ),
              eq(schema.accountingEntries.accountingCycleId, cycleId),
              eq(schema.accountingEntries.tenantId, tenantId),
              eq(schema.accountingEntries.status, 'POSTED'),
            ),
          )
          .where(
            eq(schema.accountingEntryDetails.accountPlanId, accountId),
          );

        const totalDebit = reAgg?.totalDebit ?? '0.00';
        const totalCredit = reAgg?.totalCredit ?? '0.00';

        const existingBalance = await tx.query.accountBalances.findFirst({
          where: and(
            eq(schema.accountBalances.accountingCyclesId, cycleId),
            eq(schema.accountBalances.accountPlanId, accountId),
            eq(schema.accountBalances.tenantId, tenantId),
          ),
        });

        const initNum = parseFloat(existingBalance?.initialBalance ?? '0.00');
        const debitNum = parseFloat(totalDebit);
        const creditNum = parseFloat(totalCredit);
        const finalNum = (initNum + debitNum - creditNum).toFixed(6);

        if (existingBalance) {
          await tx
            .update(schema.accountBalances)
            .set({
              debitBalance: totalDebit,
              creditBalance: totalCredit,
              finalBalance: finalNum,
              updatedById: userId,
            })
            .where(
              eq(schema.accountBalances.id, existingBalance.id),
            );
        }
      }
    }

    await this.auditHelper.logCreate(
      tenantId,
      'accountingEntries',
      { id: closingEntryId, voucherNo, description: closingDescription },
      {
        targetId: closingEntryId,
        description: `Fiscal closing entry generated: ${revenueAccounts.length} revenues, ${expenseAccounts.length} expenses, net result: ${netResult.toFixed(2)}`,
      },
    );

    return closingEntryId;
  }

  private async getNextVoucherNo(
    tenantId: string,
    createdBy: string,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<number> {
    const [setting] = await tx
      .select()
      .from(schema.moduleSettings)
      .where(
        and(
          eq(schema.moduleSettings.tenantId, tenantId),
          eq(schema.moduleSettings.module, 'accounting'),
          eq(schema.moduleSettings.submodule, 'chart_of_accounts'),
          eq(schema.moduleSettings.key, 'NRO-ASIENTO'),
        ),
      );

    const nextValue = parseInt(setting?.value ?? '0', 10) + 1;

    await tx
      .update(schema.moduleSettings)
      .set({ value: nextValue.toString(), updatedBy: createdBy })
      .where(
        and(
          eq(schema.moduleSettings.tenantId, tenantId),
          eq(schema.moduleSettings.module, 'accounting'),
          eq(schema.moduleSettings.submodule, 'chart_of_accounts'),
          eq(schema.moduleSettings.key, 'NRO-ASIENTO'),
        ),
      );

    return nextValue;
  }

  async openCycle(userId: string, tenantId: string, dto: OpenCycleDto) {
    const targetCycle = await this.drizzle.query.accountingCycles.findFirst({
      where: and(
        eq(schema.accountingCycles.id, dto.targetCycleId),
        eq(schema.accountingCycles.tenantId, tenantId),
      ),
    });

    if (!targetCycle) throw new NotFoundException('Target cycle not found.');

    if (targetCycle.status !== 'PENDING' && targetCycle.status !== 'OPEN')
      throw new BadRequestException(
        `Cycle ${targetCycle.id} is not in PENDING state.`,
      );

    const existingBalances = await this.drizzle
      .select({ id: schema.accountBalances.id })
      .from(schema.accountBalances)
      .where(
        and(
          eq(schema.accountBalances.accountingCyclesId, targetCycle.id),
          eq(schema.accountBalances.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (existingBalances.length > 0)
      throw new ConflictException('Target cycle already has balances loaded.');

    const [prevCycle] = await this.drizzle
      .select()
      .from(schema.accountingCycles)
      .where(
        and(
          eq(schema.accountingCycles.tenantId, tenantId),
          sql`${schema.accountingCycles.endDate} < ${targetCycle.startDate}`,
        ),
      )
      .orderBy(desc(schema.accountingCycles.endDate))
      .limit(1);

    if (!prevCycle) throw new BadRequestException('No previous cycle found.');

    return this.drizzle.transaction(async (tx) => {
      const prevBalances = await tx.query.accountBalances.findMany({
        where: and(
          eq(schema.accountBalances.accountingCyclesId, prevCycle.id),
          eq(schema.accountBalances.tenantId, tenantId),
        ),
      });

      const nextBalances: NewAccountBalance[] = prevBalances.map((prev) => ({
        tenantId,
        accountPlanId: prev.accountPlanId,
        accountingCyclesId: targetCycle.id,
        initialBalance: prev.finalBalance,
        debitBalance: '0.00',
        creditBalance: '0.00',
        finalBalance: prev.finalBalance,
        createdById: userId,
        updatedById: userId,
      }));

      if (nextBalances.length > 0) {
        await tx.insert(schema.accountBalances).values(nextBalances);
      }

      await tx
        .update(schema.accountingCycles)
        .set({ status: 'OPEN' })
        .where(
          and(
            eq(schema.accountingCycles.id, targetCycle.id),
            eq(schema.accountingCycles.tenantId, tenantId),
          ),
        );

      // Registra el log auditoria
      await this.auditHelper.logUpdate(
        tenantId,
        'accountingCycles',
        targetCycle,
        {
          targetId: targetCycle.id,
          description: `Cycle ${targetCycle.id} opened`,
        },
      );

      return { message: 'Cycle opened successfully' };
    });
  }

  async findAllPaginated(tenantId: string, dto: FilterAccountingBalanceDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'accountCode',
      sortOrder = 'asc',
      accountingCycleId,
    } = dto;
    const offset = (page - 1) * limit;

    // 1. Usamos un array que acepte SQL o undefined para evitar errores de tipado inicial
    const searchConditions: (SQL | undefined)[] = [
      eq(schema.accountBalances.tenantId, tenantId),
    ];

    if (accountingCycleId) {
      searchConditions.push(
        eq(schema.accountBalances.accountingCyclesId, accountingCycleId),
      );
    }

    if (search) {
      // El or() se ejecuta solo si hay search, garantizando que no sea undefined
      searchConditions.push(
        or(
          ilike(schema.accountPlan.name, `%${search}%`),
          ilike(schema.accountPlan.code, `%${search}%`),
        ),
      );
    }

    // 2. Filtramos los undefined antes de pasarlos al and(...)
    // Esto resuelve el error ts(2345) de forma definitiva
    const finalCondition = and(
      ...searchConditions.filter((c): c is SQL => !!c),
    );

    // 3. Obtener el conteo total
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`cast(count(*) as int)` }) // Cast explícito a int
      .from(schema.accountBalances)
      .innerJoin(
        schema.accountPlan,
        eq(schema.accountBalances.accountPlanId, schema.accountPlan.id),
      )
      .where(finalCondition);

    const totalCount = totalCountResult[0]?.count ?? 0;

    // 4. Obtener la data con ordenamiento dinámico
    const data = await this.drizzle
      .select({
        id: schema.accountBalances.id,
        initialBalance: schema.accountBalances.initialBalance,
        debitBalance: schema.accountBalances.debitBalance,
        creditBalance: schema.accountBalances.creditBalance,
        finalBalance: schema.accountBalances.finalBalance,
        accountCode: schema.accountPlan.code,
        accountName: schema.accountPlan.name,
        accountNature: schema.accountPlan.nature,
      })
      .from(schema.accountBalances)
      .innerJoin(
        schema.accountPlan,
        eq(schema.accountBalances.accountPlanId, schema.accountPlan.id),
      )
      .where(finalCondition)
      .orderBy(
        sortOrder === 'desc'
          ? desc(schema.accountPlan.code)
          : asc(schema.accountPlan.code),
      )
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}
