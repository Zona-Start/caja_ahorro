import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { NewAccountBalance } from '@/database/types/accounting';
import { AuditHelper } from '@/features/audit/audit-event.service';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, ilike, inArray, or, sql, SQL } from 'drizzle-orm';
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
  ) {}

  async bootstrapping(
    userId: string,
    tenantId: string,
    initialLoadDto: InitialLoadDto,
    file?: Express.Multer.File,
  ) {
    let rawBalances: any[] = [];
    if (file) {
      rawBalances = (await parseExcelFile(file.buffer)) as any[];
    } else {
      rawBalances = initialLoadDto.balances ?? [];
    }

    const groups = new Map<string, any[]>();
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
          eq(schema.accountPlan.tenantId, tenantId),
          inArray(schema.accountPlan.code, codes),
        ),
      );

    const accountMap = new Map(accountsFound.map((acc) => [acc.code, acc]));

    let totalDebits = 0;
    let totalCredits = 0;
    const payloadToInsert: NewAccountBalance[] = [];

    for (const item of uniqueBalances) {
      const account = accountMap.get(item.accountCode);
      if (!account || !account.allowsMovements) continue;

      const amount = Number(item.balance);

      // --- LOGICA CORREGIDA PARA DETERMINAR DEBITOS Y CREDITOS ---
      // Evaluamos según la naturaleza de la cuenta en el sistema, no solo por el signo del Excel.
      if (account.nature === 'DEBIT') {
        if (amount >= 0) {
          totalDebits += amount;
        } else {
          // Un saldo negativo en una cuenta deudora actúa como un crédito
          totalCredits += Math.abs(amount);
        }
      } else if (account.nature === 'CREDIT') {
        if (amount <= 0) {
          // Si el sistema viejo exportó los créditos en negativo (ej: -43819560.38)
          totalCredits += Math.abs(amount);
        } else {
          // Si el sistema viejo exportó los créditos en positivo (ej: 387419.35 de pasivo)
          totalCredits += amount;
        }
      }

      // Definir cómo se guardará en la base de datos de acuerdo a tu arquitectura.
      // (Habitualmente los saldos en la tabla base se guardan respetando su signo natural o absolutos)
      let balanceToStore = amount;
      if (account.nature === 'CREDIT' && amount > 0) {
        // Si tu backend espera los créditos firmados en negativo internamente:
        balanceToStore = -amount;
      } else if (account.nature === 'CREDIT' && amount < 0) {
        // Si ya venía negativo del excel, lo dejamos igual
        balanceToStore = amount;
      }

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

    // Evitamos problemas de precisión decimal multiplicando por 100 antes de restar
    const diff =
      Math.abs(Math.round(totalDebits * 100) - Math.round(totalCredits * 100)) /
      100;

    // Si la diferencia es mayor a 1 unidad monetaria (o un centavo, según tu nivel de tolerancia)
    if (diff > 1.0) {
      throw new ConflictException(
        `Initial Load Imbalance. Total Debits: ${totalDebits.toFixed(2)}, Total Credits: ${totalCredits.toFixed(2)}. Difference: ${diff.toFixed(2)}`,
      );
    }

    return this.drizzle.transaction(async (tx) => {
      if (payloadToInsert.length > 0) {
        await tx.insert(schema.accountBalances).values(payloadToInsert);
      }

      // Registra el log de auditoría
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

    return this.drizzle.transaction(async (tx) => {
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

      // Registra el log auditoria
      await this.auditHelper.logCreate(tenantId, 'accountingCycles', cycle, {
        targetId: cycleId,
        description: `Cycle ${cycleId} closed`,
      });

      return { message: 'Cycle closed successfully' };
    });
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
        finalBalance: schema.accountBalances.finalBalance,
        accountCode: schema.accountPlan.code,
        accountName: schema.accountPlan.name,
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
