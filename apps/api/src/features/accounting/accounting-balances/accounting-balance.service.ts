import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import {
  activeAccountBalancesView,
  periodAccountMovementsView,
} from '@/database/schema/views/accounting';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import { ActionEnumAudit } from '@/types/enum';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, asc, desc, eq, ilike, inArray, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { AccountPlanService } from '../account-plan/account-plan.service';
import { CloseCycleDto } from './dto/close-cycle.dto';
import { FilterAccountingBalanceDto } from './dto/filter-accounting-balance.dto';
import { InitialLoadDto } from './dto/initial-load.dto';
import { OpenCycleDto } from './dto/open-cycle.dto';
import { parseExcelFile } from './utils/excel-parser.util';

@Injectable()
export class AccountingBalanceService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly accountPlanService: AccountPlanService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // async bootstrapping(
  //   userId: number,
  //   initialLoadDto: InitialLoadDto,
  //   file?: Express.Multer.File,
  // ) {
  //   let balances: {
  //     accountCode: string;
  //     descripcion: string;
  //     balance: number;
  //   }[];

  //   // Determinar la fuente de datos: archivo Excel o JSON
  //   if (file) {
  //     // Parsear el archivo Excel
  //     balances = await parseExcelFile(file.buffer);
  //   } else if (initialLoadDto.balances && initialLoadDto.balances.length > 0) {
  //     // Usar los datos del DTO
  //     balances = initialLoadDto.balances;
  //   } else {
  //     throw new BadRequestException(
  //       'Debe proporcionar datos en formato JSON o un archivo Excel',
  //     );
  //   }

  //   // --- PASO 1: Validaciones Previas ---
  //   const currentYear = new Date().getFullYear();
  //   const [activeCycle] = await this.drizzle
  //     .select()
  //     .from(schema.accountingCycles)
  //     .where(
  //       and(
  //         eq(schema.accountingCycles.status, 'OPEN'),
  //         sql`EXTRACT(YEAR FROM ${schema.accountingCycles.startDate}) = ${currentYear}`,
  //       ),
  //     )
  //     .limit(1);

  //   if (!activeCycle) {
  //     throw new NotFoundException('No active accounting cycle found.');
  //   }

  //   // Verificar que la tabla esté vacía para este ciclo
  //   const existingBalances = await this.drizzle
  //     .select({ id: schema.accountBalances.id })
  //     .from(schema.accountBalances)
  //     .where(eq(schema.accountBalances.accountingCyclesId, activeCycle.id))
  //     .limit(1);

  //   if (existingBalances.length > 0) {
  //     throw new BadRequestException('Balances already loaded for this cycle.');
  //   }

  //   const entriesCount = await this.drizzle
  //     .select({ count: sql<number>`count(*)` })
  //     .from(schema.accountingEntries)
  //     .where(eq(schema.accountingEntries.accountingCycleId, activeCycle.id));

  //   if (Number(entriesCount[0].count) > 0) {
  //     throw new BadRequestException(
  //       'No se puede ejecutar Carga Inicial en un ciclo que ya tiene movimientos contables.',
  //     );
  //   }

  //   // --- PASO 2: Optimización (Traer cuentas en bloque) ---
  //   // Extraemos los códigos para hacer una sola consulta
  //   const codes = balances.map((b) => b.accountCode);

  //   const accountsFound = await this.drizzle
  //     .select({
  //       id: schema.accountPlan.id,
  //       code: schema.accountPlan.code,
  //       nature: schema.accountPlan.nature, // 'DEBIT' | 'CREDIT'
  //       allowsMovements: schema.accountPlan.allowsMovements,
  //     })
  //     .from(schema.accountPlan)
  //     .where(
  //       and(
  //         eq(schema.accountPlan.companyId, activeCycle.companyId),
  //         inArray(schema.accountPlan.code, codes),
  //       ),
  //     );

  //   // Creamos un Mapa para acceso rápido O(1)
  //   const accountMap = new Map(accountsFound.map((acc) => [acc.code, acc]));

  //   // --- PASO 3: Validación de Ecuación Contable en Memoria ---
  //   let totalDebits = 0;
  //   let totalCredits = 0;
  //   const payloadToInsert: (typeof schema.accountBalances.$inferInsert)[] = [];

  //   for (const item of balances) {
  //     const account = accountMap.get(item.accountCode);

  //     if (!account) {
  //       throw new NotFoundException(
  //         `Account code ${item.accountCode} not found.`,
  //       );
  //     }

  //     if (!account.allowsMovements) {
  //       continue;
  //     }

  //     // Normalización: Convertimos a valor absoluto para evitar errores con signos negativos
  //     // (ej. pasivos reportados como negativos en Excel).
  //     const amount = Math.abs(Number(item.balance));

  //     // Lógica de Ecuación Patrimonial
  //     // Si la cuenta es DEUDORA, suma al DEBE. Si es ACREEDORA, suma al HABER.
  //     if (account.nature === 'DEBIT') {
  //       totalDebits += amount;
  //     } else {
  //       totalCredits += amount;
  //     }

  //     // Preparamos el objeto para insertar
  //     payloadToInsert.push({
  //       companyId: activeCycle.companyId,
  //       accountPlanId: account.id,
  //       accountingCyclesId: activeCycle.id,
  //       // LA CLAVE: Insertamos directo en initialBalance
  //       initialBalance: String(amount),
  //       // Los movimientos nacen en 0 porque no hay asientos
  //       debitBalance: '0.00',
  //       creditBalance: '0.00',
  //       // Al inicio, el final es igual al inicial
  //       finalBalance: String(amount),
  //       createdById: userId, // Asumiendo que tienes este campo en tu esquema (opcional)
  //     });
  //   }

  //   // Verificamos Cuadre (Tolerancia 0.01)
  //   if (Math.abs(totalDebits - totalCredits) > 0.01) {
  //     throw new ConflictException(
  //       `Initial Load Imbalance: Debits (${totalDebits}) != Credits (${totalCredits})`,
  //     );
  //   }

  //   // --- PASO 4: Ejecución (Transacción) ---
  //   return this.drizzle.transaction(async (tx) => {
  //     // Bulk Insert eficiente
  //     if (payloadToInsert.length > 0) {
  //       await tx.insert(schema.accountBalances).values(payloadToInsert);
  //     }

  //     // Audit Log
  //     this.eventEmitter.emit(
  //       'audit.log',
  //       new AuditLogEvent({
  //         tableName: 'accountBalances',
  //         recordId: String(activeCycle.id),
  //         action: ActionEnumAudit.DATA_IMPORT, // O el enum que uses
  //         userId: Number(userId),
  //         area: 'CONTABLE',
  //         description: 'Carga Inicial de Saldos (Inyección Directa)',
  //         newData: { cycleId: activeCycle.id, count: payloadToInsert.length },
  //       }),
  //     );

  //     return {
  //       message: 'Bootstrapping completed successfully.',
  //       stats: { count: payloadToInsert.length, totalAmount: totalDebits },
  //     };
  //   });
  // }

  /**
   * 1. Agente de Carga Inicial (The Bootstrapper) - FINAL CORREGIDO
   * Estrategia: Inyección Directa de Saldos (Sin Asientos)
   * Acepta datos en formato JSON o archivo Excel
   * Soporta formato con PUNTOS (ej. 111.02.00.00) y elimina duplicados de auxiliares.
   */

  /**
   * 1. Agente de Carga Inicial - MODO AUDITORÍA
   * Detecta por qué no cuadra y te lista las cuentas culpables.
   */
  async bootstrapping(
    userId: number,
    initialLoadDto: InitialLoadDto,
    file?: Express.Multer.File,
  ) {
    // ... (Parsing del archivo Excel/DTO se mantiene igual) ...
    interface RawBalanceItem {
      accountCode?: string;
      CUENTA?: string;
      cuenta?: string;
      balance?: number;
      SALDO_ACTUAL?: number;
      saldo_actual?: number;
      AUXILIAR?: string;
      auxiliar?: string;
      aux?: string;
    }

    let rawBalances: RawBalanceItem[] = [];
    if (file) {
      rawBalances = (await parseExcelFile(file.buffer)) as RawBalanceItem[];
    } else {
      rawBalances = initialLoadDto.balances ?? [];
    }

    // --- 1. LIMPIEZA Y DESDUPLICACIÓN (Igual que antes) ---
    const groups = new Map<string, RawBalanceItem[]>();
    for (const item of rawBalances) {
      const rawCode = item.accountCode ?? item.CUENTA ?? item.cuenta;
      const code = String(rawCode || '').trim();
      if (!code) continue;
      if (!groups.has(code)) groups.set(code, []);
      groups.get(code)!.push(item);
    }

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
          return (
            aux && String(aux).trim() !== '' && String(aux).trim() !== '000'
          );
        });
      }
      const totalBalance = finalRows.reduce((sum, row) => {
        const val = row.balance ?? row.SALDO_ACTUAL ?? row.saldo_actual ?? 0;
        return sum + Number(val);
      }, 0);

      // OJO: Agregamos incluso si es 0 para validar existencia
      uniqueBalances.push({ accountCode: code, balance: totalBalance });
    });

    // ... (Validaciones de Ciclo y Tabla Vacía se mantienen igual) ...
    const currentYear = new Date().getFullYear();
    const [activeCycle] = await this.drizzle
      .select()
      .from(schema.accountingCycles)
      .where(
        and(
          eq(schema.accountingCycles.status, 'OPEN'),
          sql`EXTRACT(YEAR FROM ${schema.accountingCycles.startDate}) = ${currentYear}`,
        ),
      )
      .limit(1);
    if (!activeCycle)
      throw new NotFoundException('No active accounting cycle found.');

    // Validar saldo existente
    const existing = await this.drizzle
      .select({ id: schema.accountBalances.id })
      .from(schema.accountBalances)
      .where(eq(schema.accountBalances.accountingCyclesId, activeCycle.id))
      .limit(1);
    if (existing.length > 0)
      throw new BadRequestException('Balances already loaded.');

    // Validar asientos
    const entries = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.accountingEntries)
      .where(eq(schema.accountingEntries.accountingCycleId, activeCycle.id));
    if (Number(entries[0].count) > 0)
      throw new BadRequestException('Cycle has existing entries.');

    // --- 2. OBTENCIÓN DE PLAN DE CUENTAS ---
    const codes = uniqueBalances.map((b) => b.accountCode);
    const accountsFound = await this.drizzle
      .select({
        id: schema.accountPlan.id,
        code: schema.accountPlan.code,
        nature: schema.accountPlan.nature,
        allowsMovements: schema.accountPlan.allowsMovements,
        name: schema.accountPlan.name,
      })
      .from(schema.accountPlan)
      .where(
        and(
          eq(schema.accountPlan.companyId, activeCycle.companyId),
          inArray(schema.accountPlan.code, codes),
        ),
      );

    const accountMap = new Map(accountsFound.map((acc) => [acc.code, acc]));

    // --- 3. CÁLCULO CON REPORTE DE EXCLUSIONES ---
    let totalDebits = 0;
    let totalCredits = 0;
    const payloadToInsert: (typeof schema.accountBalances.$inferInsert)[] = [];

    // Variables para auditoría de error
    const ignoredNotFound: any[] = [];
    const ignoredParent: any[] = [];

    for (const item of uniqueBalances) {
      const account = accountMap.get(item.accountCode);
      const amount = Number(item.balance);

      // CASO A: Cuenta no existe en DB
      if (!account) {
        if (Math.abs(amount) > 0.01) {
          // Solo nos importa si tiene saldo
          ignoredNotFound.push({ code: item.accountCode, amount });
        }
        continue;
      }

      // CASO B: Cuenta es Padre (No imputable)
      if (!account.allowsMovements) {
        if (Math.abs(amount) > 0.01) {
          ignoredParent.push({
            code: item.accountCode,
            name: account.name,
            amount,
          });
        }
        continue;
      }

      // CASO C: Cuenta Válida
      if (amount > 0) {
        totalDebits += amount;
      } else {
        totalCredits += Math.abs(amount);
      }

      // Normalización de signo para BD
      let balanceToStore = amount;
      if (account.nature === 'CREDIT') balanceToStore = -amount;

      payloadToInsert.push({
        companyId: activeCycle.companyId,
        accountPlanId: account.id,
        accountingCyclesId: activeCycle.id,
        initialBalance: String(balanceToStore),
        debitBalance: '0.00',
        creditBalance: '0.00',
        finalBalance: String(balanceToStore),
        createdById: userId,
      });
    }

    // --- 4. VERIFICACIÓN FINAL Y REPORTE DE ERRORES ---
    const diff = Math.abs(totalDebits - totalCredits);

    if (diff > 1.0) {
      const formatter = new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
      });

      let errorMessage = `Descuadre Contable: DEBE ${formatter.format(totalDebits)} vs HABER ${formatter.format(totalCredits)}. Diferencia: ${formatter.format(diff)}.`;

      // --- FRANCOTIRADOR: BUSCA EL MONTO EXACTO ---
      // Buscamos cuál de las cuentas ignoradas tiene un monto igual a la diferencia (+/- 2 bolívares)
      const culprit = ignoredParent.find(
        (i) => Math.abs(i.amount - diff) < 2.0,
      );

      if (culprit) {
        errorMessage += `\n\n🎯 [CULPABLE ENCONTRADO] La cuenta "${culprit.code} - ${culprit.name}" tiene un saldo de ${formatter.format(culprit.amount)}. \nMOTIVO: En tu Base de Datos es una cuenta PADRE (allowsMovements=false), por eso el sistema la ignoró. \nSOLUCIÓN: Ve a la tabla 'account_plan' y ponle 'allows_movements = true'.`;
      } else {
        // Si no es exacto, mostramos las que se acercan más al monto del error (no las más grandes)
        // Ordenamos por cercanía a la diferencia
        const closest = ignoredParent
          .sort((a, b) => Math.abs(a.amount - diff) - Math.abs(b.amount - diff))
          .slice(0, 3);

        errorMessage += `\n\n[POSIBLES CULPABLES] Estas son las cuentas ignoradas con saldos más cercanos al error:\n`;
        closest.forEach((c) => {
          errorMessage += `- ${c.code}: ${formatter.format(c.amount)} (Diferencia: ${formatter.format(Math.abs(c.amount - diff))})\n`;
        });
      }

      throw new ConflictException(errorMessage);
    }

    // ... (Transacción de inserción) ...
    return this.drizzle.transaction(async (tx) => {
      if (payloadToInsert.length > 0) {
        await tx.insert(schema.accountBalances).values(payloadToInsert);
      }
      // ... emit audit log ...
      return { message: 'Success' };
    });
  }

  /**
   * 2. Agente de Cierre (The Closer)
   */
  async closeCycle(userId: number, cycleId: number, dto: CloseCycleDto) {
    const cycle = await this.drizzle.query.accountingCycles.findFirst({
      where: eq(schema.accountingCycles.id, cycleId),
    });

    if (!cycle) throw new NotFoundException('Cycle not found');
    if (cycle.status !== 'OPEN')
      throw new BadRequestException('Cycle is not OPEN');

    // A. Validaciones Críticas
    const pendingEntries = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.accountingEntries)
      .where(
        and(
          eq(schema.accountingEntries.accountingCycleId, cycleId),
          inArray(schema.accountingEntries.status, ['DRAFT', 'PENDING']),
        ),
      );

    if (Number(pendingEntries[0].count) > 0) {
      throw new BadRequestException(
        'Cannot close cycle with DRAFT or PENDING entries.',
      );
    }

    // Balanceo Matemático
    const balanceCheck = await this.drizzle
      .select({
        totalDebit: sql<number>`sum(${periodAccountMovementsView.periodDebit})`,
        totalCredit: sql<number>`sum(${periodAccountMovementsView.periodCredit})`,
      })
      .from(periodAccountMovementsView)
      .where(eq(periodAccountMovementsView.accountingCycleId, cycleId));

    const diff = Math.abs(
      (balanceCheck[0].totalDebit || 0) - (balanceCheck[0].totalCredit || 0),
    );
    if (diff > 0.01) {
      throw new ConflictException(
        `Accounting imbalance detected. Diff: ${diff}`,
      );
    }

    return this.drizzle.transaction(async (tx) => {
      // B. Refundición (Fiscal Close)
      if (dto.isFiscalYearEnd) {
        // Better: Fetch accounts with their balances and types
        const accounts = await tx
          .select({
            planId: schema.accountPlan.id,
            type: schema.accountPlan.accountType,
            balance: activeAccountBalancesView.currentBalance,
            nature: schema.accountPlan.nature,
          })
          .from(activeAccountBalancesView)
          .innerJoin(
            schema.accountPlan,
            eq(activeAccountBalancesView.accountPlanId, schema.accountPlan.id),
          )
          .where(eq(activeAccountBalancesView.accountingCycleId, cycleId));

        let revenueSum = 0;
        let expenseSum = 0;
        const details: {
          accountPlanId: number;
          debit: string;
          credit: string;
          description: string;
        }[] = [];

        for (const acc of accounts) {
          const bal = Number(acc.balance);
          if (acc.type === 'REVENUE') {
            revenueSum += bal; // Usually Credit (positive in view logic for Credit nature?)
            // View logic:
            // if nature=DEBIT: init + debit - credit
            // if nature=CREDIT: init + credit - debit
            // So positive balance means "Has balance".
            // To close Revenue (Credit nature), we must DEBIT it.
            if (bal !== 0) {
              details.push({
                accountPlanId: acc.planId,
                debit: String(bal),
                credit: '0',
                description: 'Cierre Fiscal - Cancelación Ingresos',
              });
            }
          } else if (acc.type === 'EXPENSE') {
            expenseSum += bal; // Usually Debit
            // To close Expense (Debit nature), we must CREDIT it.
            if (bal !== 0) {
              details.push({
                accountPlanId: acc.planId,
                debit: '0',
                credit: String(bal),
                description: 'Cierre Fiscal - Cancelación Gastos',
              });
            }
          }
        }

        const result = revenueSum - expenseSum; // Profit if positive

        // Find Equity Account for Result
        const config = await tx.query.accountingConfiguration.findFirst({
          where: eq(
            schema.accountingConfiguration.operationType,
            'FISCAL_YEAR_RESULT',
          ),
        });

        if (!config || !config.creditAccountId) {
          // Fallback or error. For now, error.
          throw new BadRequestException(
            'FISCAL_YEAR_RESULT account not configured.',
          );
        }
        const equityAccountId = config.creditAccountId;

        // Register Result
        if (result > 0) {
          // Profit: Credit Equity
          details.push({
            accountPlanId: equityAccountId,
            debit: '0',
            credit: String(result),
            description: 'Utilidad del Ejercicio',
          });
        } else if (result < 0) {
          // Loss: Debit Equity
          details.push({
            accountPlanId: equityAccountId,
            debit: String(Math.abs(result)),
            credit: '0',
            description: 'Pérdida del Ejercicio',
          });
        }

        if (details.length > 0) {
          const [closeEntry] = await tx
            .insert(schema.accountingEntries)
            .values({
              companyId: cycle.companyId,
              accountingCycleId: cycleId,
              entryDate: new Date().toISOString().split('T')[0], // Should be cycle end date
              description: 'Asiento de Cierre Fiscal (Refundición)',
              originType: 'FISCAL_CLOSE',
              status: 'POSTED',
              currencyCode: 'VES',
              postedAt: new Date(),
            })
            .returning();

          await tx
            .insert(schema.accountingEntryDetails)
            .values(
              details.map((d) => ({ ...d, accountingEntryId: closeEntry.id })),
            );
        }
      }

      // C. Snapshot & Sellado
      // Refresh view results after potential fiscal close
      const finalSnapshot = await tx
        .select()
        .from(activeAccountBalancesView)
        .where(eq(activeAccountBalancesView.accountingCycleId, cycleId));

      for (const row of finalSnapshot) {
        await tx
          .update(schema.accountBalances)
          .set({
            debitBalance: row.periodDebit,
            creditBalance: row.periodCredit,
            finalBalance: row.currentBalance,
          })
          .where(
            and(
              eq(schema.accountBalances.accountingCyclesId, cycleId),
              eq(schema.accountBalances.accountPlanId, row.accountPlanId),
            ),
          );
      }

      // Close Cycle
      await tx
        .update(schema.accountingCycles)
        .set({
          status: 'CLOSED',
          closedAt: new Date(),
          closedByUser_id: userId,
        })
        .where(eq(schema.accountingCycles.id, cycleId));

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'accountingCycles',
          recordId: String(cycleId),
          action: ActionEnumAudit.UPDATE,
          userId: Number(userId),
          area: 'CONTABLE',
          description: 'Cierre de Ciclo Contable (Snapshot)',
          newData: { status: 'CLOSED', isFiscalYearEnd: dto.isFiscalYearEnd },
        }),
      );

      return { message: 'Cycle closed successfully' };
    });
  }

  /**
   * 3. Agente de Apertura (The Opener) - REFACTORIZADO
   * Rol: Activar un ciclo existente arrastrando saldos del anterior.
   */
  async openCycle(userId: number, dto: OpenCycleDto) {
    // 1. Obtener el Ciclo Destino (Target)
    // Este ciclo ya fue creado por el otro módulo, probablemente en estatus 'PENDING'
    const targetCycle = await this.drizzle.query.accountingCycles.findFirst({
      where: eq(schema.accountingCycles.id, dto.targetCycleId),
    });

    if (!targetCycle) throw new NotFoundException('Target cycle not found.');

    // Validación: No podemos abrir un ciclo que ya está abierto o cerrado
    if (targetCycle.status !== 'PENDING' && targetCycle.status !== 'OPEN') {
      // Ajusta 'PENDING' según tu enum real. Si usan 'OPEN' pero vacío, ajusta aquí.
      throw new BadRequestException(
        `Cycle ${targetCycle.id} is not in PENDING state.`,
      );
    }

    // Validación: Asegurar que no tenga saldos ya cargados (Idempotencia)
    const existingBalances = await this.drizzle
      .select({ id: schema.accountBalances.id })
      .from(schema.accountBalances)
      .where(eq(schema.accountBalances.accountingCyclesId, targetCycle.id))
      .limit(1);

    if (existingBalances.length > 0) {
      throw new ConflictException('Target cycle already has balances loaded.');
    }

    // 2. Encontrar Automáticamente el Ciclo Anterior (Previous Cycle)
    // Lógica: Buscar el ciclo de la misma compañía cuya fecha fin sea menor a la fecha inicio del target
    // Ordenado descendente para tomar el más reciente.
    const [prevCycle] = await this.drizzle
      .select()
      .from(schema.accountingCycles)
      .where(
        and(
          eq(schema.accountingCycles.companyId, targetCycle.companyId),
          sql`${schema.accountingCycles.endDate} < ${targetCycle.startDate}`,
        ),
      )
      .orderBy(desc(schema.accountingCycles.endDate))
      .limit(1);

    if (!prevCycle) {
      throw new BadRequestException(
        'No previous cycle found to roll-forward balances from. Use Initial Load for the first cycle.',
      );
    }

    if (prevCycle.status !== 'CLOSED') {
      throw new BadRequestException(
        `Previous cycle (${prevCycle.description}) must be CLOSED before opening the new one.`,
      );
    }

    // 3. Detectar Tipo de Apertura (Fiscal vs Continuidad)
    const targetYear = new Date(targetCycle.startDate).getFullYear();
    const prevYear = new Date(prevCycle.endDate).getFullYear();
    const isNewFiscalYear = targetYear > prevYear;

    return this.drizzle.transaction(async (tx) => {
      // 4. Leer Saldos Finales del Ciclo Anterior
      const prevBalances = await tx.query.accountBalances.findMany({
        where: eq(schema.accountBalances.accountingCyclesId, prevCycle.id),
        with: { accountPlan: true },
      });

      // 5. Preparar Payload (Matriz de Arrastre)
      const nextBalances: (typeof schema.accountBalances.$inferInsert)[] =
        prevBalances.map((prev) => {
          let nextInitial = prev.finalBalance;

          // --- REGLA DE NEGOCIO: RESET ANUAL ---
          if (isNewFiscalYear) {
            const type = (prev.accountPlan as any).accountType; // Asegurar tipado correcto en tu proyecto
            // Si es Ingreso o Gasto, nace en 0.00
            if (type === 'REVENUE' || type === 'EXPENSE') {
              nextInitial = '0.00';
            }
          }
          // -------------------------------------

          return {
            companyId: targetCycle.companyId,
            accountPlanId: prev.accountPlanId,
            accountingCyclesId: targetCycle.id,
            initialBalance: nextInitial, // La magia ocurre aquí
            debitBalance: '0.00',
            creditBalance: '0.00',
            finalBalance: nextInitial,
            createdById: userId,
          };
        });

      // 6. Insertar Saldos (Bulk Insert)
      if (nextBalances.length > 0) {
        await tx.insert(schema.accountBalances).values(nextBalances);
      }

      // 7. Actualizar Estatus del Ciclo a 'OPEN'
      await tx
        .update(schema.accountingCycles)
        .set({ status: 'OPEN' }) // Ahora sí está oficial abierto
        .where(eq(schema.accountingCycles.id, targetCycle.id));

      // 8. Audit Log
      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'accountingCycles',
          recordId: String(targetCycle.id),
          action: ActionEnumAudit.UPDATE,
          userId: Number(userId),
          area: 'CONTABLE',
          description: isNewFiscalYear
            ? 'Apertura de Año Fiscal (Reinicio de Nominales)'
            : 'Apertura de Ciclo Trimestral (Continuidad)',
          newData: {
            cycleId: targetCycle.id,
            prevCycleId: prevCycle.id,
            type: isNewFiscalYear ? 'FISCAL_YEAR' : 'CONTINUITY',
          },
        }),
      );

      return {
        message: 'Cycle opened successfully',
        type: isNewFiscalYear ? 'FISCAL_YEAR_OPENING' : 'CONTINUITY_OPENING',
      };
    });
  }

  async findAllPaginated(
    dto: FilterAccountingBalanceDto,
  ): Promise<{ data: any[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'accountCode',
      sortOrder = 'asc',
      accountingCycleId,
      companyId,
    } = dto;

    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [];

    if (accountingCycleId) {
      searchConditions.push(
        eq(
          schema.accountBalances.accountingCyclesId,
          Number(accountingCycleId),
        ),
      );
    }

    if (companyId) {
      searchConditions.push(
        eq(schema.accountBalances.companyId, Number(companyId)),
      );
    }

    if (search) {
      const searchOr = or(
        ilike(schema.accountPlan.name, `%${search}%`),
        ilike(schema.accountPlan.code, `%${search}%`),
      );
      if (searchOr) {
        searchConditions.push(searchOr);
      }
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    // Sort mapping
    let orderBy: SQL<unknown>;
    if (sortBy === 'accountCode') {
      orderBy =
        sortOrder === 'asc'
          ? asc(schema.accountPlan.code)
          : desc(schema.accountPlan.code);
    } else if (sortBy === 'accountName') {
      orderBy =
        sortOrder === 'asc'
          ? asc(schema.accountPlan.name)
          : desc(schema.accountPlan.name);
    } else {
      // Default fallback to account code
      orderBy =
        sortOrder === 'asc'
          ? asc(schema.accountPlan.code)
          : desc(schema.accountPlan.code);
    }

    // Count
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.accountBalances)
      .innerJoin(
        schema.accountPlan,
        eq(schema.accountBalances.accountPlanId, schema.accountPlan.id),
      )
      .where(searchCondition ?? sql`true`);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Data
    const data = await this.drizzle
      .select({
        id: schema.accountBalances.id,
        companyId: schema.accountBalances.companyId,
        accountingCycleId: schema.accountBalances.accountingCyclesId,
        accountPlanId: schema.accountBalances.accountPlanId,
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
      .where(searchCondition ?? sql`true`)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const meta = {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return { data, meta };
  }
}
