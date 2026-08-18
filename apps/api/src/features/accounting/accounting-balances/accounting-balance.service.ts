import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import {
  NewAccountBalance,
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

    if (rawBalances.length === 0) {
      throw new BadRequestException(
        'No se proporcionaron saldos para la carga inicial.',
      );
    }

    // 2. Validar ciclo contable activo
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

    // 3. Validar que no exista una carga inicial previa (asiento voucherNo = 1)
    const [existingInitialEntry] = await this.drizzle
      .select({ id: schema.accountingEntries.id })
      .from(schema.accountingEntries)
      .where(
        and(
          eq(schema.accountingEntries.tenantId, tenantId),
          eq(schema.accountingEntries.description, 'CARGA INICIAL DE SALDO'),
          eq(schema.accountingEntries.voucherNo, 1),
        ),
      )
      .limit(1);
    if (existingInitialEntry)
      throw new BadRequestException(
        'La carga inicial de saldos ya fue realizada.',
      );

    // 4. Cargar plan de cuentas
    const accountPlans = await this.drizzle
      .select({
        id: schema.accountPlan.id,
        code: schema.accountPlan.code,
        name: schema.accountPlan.name,
        nature: schema.accountPlan.nature,
        accountType: schema.accountPlan.accountType,
        allowsMovements: schema.accountPlan.allowsMovements,
      })
      .from(schema.accountPlan)
      .where(eq(schema.accountPlan.tenantId, tenantId));

    const accountMap = new Map(accountPlans.map((a) => [a.code, a]));

    // 5. Construir detalles del asiento y resolver auxiliares
    const details: any[] = [];
    let totalDebit = 0;
    let totalCredit = 0;
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const item of rawBalances) {
      const rawCode = item.accountCode ?? item.CUENTA ?? item.cuenta;
      const code = String(rawCode || '').trim();
      const account = accountMap.get(code);

      if (!account) {
        throw new BadRequestException(
          `Cuenta no encontrada en el plan contable: ${code}`,
        );
      }

      const amount = Number(item.balance);

      // Resolver asociado por cédula
      let associateId: string | null = null;
      const auxiliarSocio = String(
        item.auxiliarSocio ?? item.AUXILIAR_SOCIO ?? item.auxiliar_socio ?? '',
      ).trim();
      if (auxiliarSocio !== '') {
        const [assoc] = await this.drizzle
          .select({ id: schema.associates.id })
          .from(schema.associates)
          .where(
            and(
              eq(schema.associates.tenantId, tenantId),
              eq(schema.associates.cedula, auxiliarSocio),
            ),
          )
          .limit(1);
        if (!assoc) {
          throw new BadRequestException(
            `Asociado no encontrado con cédula: ${auxiliarSocio}`,
          );
        }
        associateId = assoc.id;
      }

      // Resolver proveedor
      let supplierId: string | null = null;
      const auxiliarProveedor = String(
        item.auxiliarProveedor ??
          item.AUXILIAR_PROVEEDOR ??
          item.auxiliar_proveedor ??
          '',
      ).trim();
      if (auxiliarProveedor !== '') {
        const [sup] = await this.drizzle
          .select({ id: schema.suppliers.id })
          .from(schema.suppliers)
          .where(
            and(
              eq(schema.suppliers.tenantId, tenantId),
              or(
                eq(schema.suppliers.taxId, auxiliarProveedor),
                eq(schema.suppliers.internalCode, auxiliarProveedor),
                eq(schema.suppliers.name, auxiliarProveedor),
              ),
            ),
          )
          .limit(1);
        if (!sup) {
          throw new BadRequestException(
            `Proveedor no encontrado: ${auxiliarProveedor}`,
          );
        }
        supplierId = sup.id;
      }

      // Determinar débito/crédito según la naturaleza de la cuenta
      const absAmount = Math.abs(amount);
      let debit = '0.000000';
      let credit = '0.000000';

      if (account.nature === 'DEBIT') {
        if (amount >= 0) {
          debit = absAmount.toFixed(6);
          totalDebit += absAmount;
        } else {
          credit = absAmount.toFixed(6);
          totalCredit += absAmount;
        }
      } else {
        if (amount >= 0) {
          credit = absAmount.toFixed(6);
          totalCredit += absAmount;
        } else {
          debit = absAmount.toFixed(6);
          totalDebit += absAmount;
        }
      }

      // Acumular por tipo para validar la ecuación contable
      if (account.accountType === 'ASSET') totalAssets += amount;
      else if (account.accountType === 'LIABILITY') totalLiabilities += amount;
      else if (account.accountType === 'EQUITY') totalEquity += amount;

      details.push({
        accountPlanId: account.id,
        associateId,
        supplierId,
        debit,
        credit,
        description: item.descripcion ?? item.descripcion ?? null,
        createdById: userId,
      });
    }

    // 6. Validar partida doble (débitos = créditos)
    const debitCreditDiff = Math.abs(totalDebit - totalCredit);
    if (debitCreditDiff > 1.0) {
      throw new ConflictException(
        `Carga inicial desbalanceada. Total Débitos: ${totalDebit.toFixed(2)}, Total Créditos: ${totalCredit.toFixed(2)}. Diferencia: ${debitCreditDiff.toFixed(2)}`,
      );
    }

    // 7. Validar ecuación contable ACTIVO = PASIVO + PATRIMONIO
    const liabilitiesEquity = Math.abs(totalLiabilities + totalEquity);
    const equationDiff = Math.abs(Math.abs(totalAssets) - liabilitiesEquity);
    if (equationDiff > 1.0) {
      throw new ConflictException(
        `La ecuación contable no se cumple. ACTIVO: ${Math.abs(totalAssets).toFixed(2)} vs PASIVO + PATRIMONIO: ${liabilitiesEquity.toFixed(2)}. Diferencia: ${equationDiff.toFixed(2)}`,
      );
    }

    // 8. Crear asiento de apertura en transacción
    return this.drizzle.transaction(async (tx) => {
      const [entry] = await tx
        .insert(schema.accountingEntries)
        .values({
          tenantId,
          accountingCycleId: activeCycle.id,
          entryDate: activeCycle.startDate,
          description: 'CARGA INICIAL DE SALDO',
          voucherNo: 1,
          originType: 'INITIAL_LOAD',
          status: 'POSTED',
          postedAt: new Date(),
          currencyCode: 'VES',
          createdById: userId,
        })
        .returning({ id: schema.accountingEntries.id });

      const detailsToInsert = details.map((d) => ({
        ...d,
        accountingEntryId: entry.id,
      }));

      if (detailsToInsert.length > 0) {
        await tx.insert(schema.accountingEntryDetails).values(detailsToInsert);
      }

      // Actualizar contador de comprobantes a 1
      await tx
        .update(schema.moduleSettings)
        .set({ value: '1', updatedBy: userId })
        .where(
          and(
            eq(schema.moduleSettings.tenantId, tenantId),
            eq(schema.moduleSettings.module, 'accounting'),
            eq(schema.moduleSettings.submodule, 'chart_of_accounts'),
            eq(schema.moduleSettings.key, 'NRO-ASIENTO'),
          ),
        );

      await this.auditHelper.logCreate(
        tenantId,
        'accountingEntries',
        { id: entry.id, voucherNo: 1, description: 'CARGA INICIAL DE SALDO' },
        {
          targetId: entry.id,
          description: `Carga inicial de saldos realizada. Cuentas registradas: ${detailsToInsert.length}.`,
        },
      );

      return {
        message: 'Carga inicial de saldos realizada exitosamente',
        entryId: entry.id,
        voucherNo: 1,
        processedAccounts: detailsToInsert.length,
      };
    });
  }

  async hasInitialLoad(tenantId: string) {
    const [entry] = await this.drizzle
      .select({ id: schema.accountingEntries.id })
      .from(schema.accountingEntries)
      .where(
        and(
          eq(schema.accountingEntries.tenantId, tenantId),
          eq(schema.accountingEntries.description, 'CARGA INICIAL DE SALDO'),
          eq(schema.accountingEntries.voucherNo, 1),
        ),
      )
      .limit(1);

    return { hasInitialLoad: !!entry };
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
