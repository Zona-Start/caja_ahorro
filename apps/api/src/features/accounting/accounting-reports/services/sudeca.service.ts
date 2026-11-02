import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  SUDECA_REPORT_TYPES,
  SudecaDto,
  type SudecaReportType,
} from '../dto/sudeca.dto';
import { buildSudecaTableContent } from '../templates/pdf/sudeca.template';

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const TITLES: Record<SudecaReportType, string> = {
  'financial-situation': 'SITUACIÓN FINANCIERA',
  'income-statement': 'ESTADO DE RESULTADO',
  'trial-balance': 'BALANCE DE COMPROBACIÓN',
};

export interface SudecaRow {
  accountCode: string;
  accountName: string;
  previous: string;
  current: string;
  variation: string;
  debit?: string;
  credit?: string;
}

@Injectable()
export class SudecaService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  async getData(tenantId: string, type: SudecaReportType, filters: SudecaDto) {
    this.assertType(type);

    const [cycle] = await this.drizzle
      .select({
        id: schema.accountingCycles.id,
        description: schema.accountingCycles.description,
        startDate: schema.accountingCycles.startDate,
        endDate: schema.accountingCycles.endDate,
      })
      .from(schema.accountingCycles)
      .where(
        and(
          eq(schema.accountingCycles.id, filters.accountingCycleId),
          eq(schema.accountingCycles.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!cycle) {
      throw new NotFoundException('Ciclo contable no encontrado.');
    }

    const year = this.toDate(cycle.startDate).getFullYear();
    const quarter = filters.quarter;
    const startMonth = (quarter - 1) * 3;

    const currentStart = new Date(year, startMonth, 1);
    const currentEnd = new Date(year, startMonth + 3, 0);
    const previousStart = new Date(year, startMonth - 3, 1);
    const previousEnd = new Date(year, startMonth, 0);

    const currentStartStr = this.toDateString(currentStart);
    const currentEndStr = this.toDateString(currentEnd);
    const previousStartStr = this.toDateString(previousStart);
    const previousEndStr = this.toDateString(previousEnd);

    const accounts = await this.drizzle
      .select({
        accountPlanId: schema.accountPlan.id,
        accountCode: schema.accountPlan.code,
        accountName: schema.accountPlan.name,
        accountType: schema.accountPlan.accountType,
        accountNature: schema.accountPlan.nature,
        parentAccountId: schema.accountPlan.parentAccountId,
        initialBalance: sql<string>`COALESCE(${schema.accountBalances.initialBalance}, '0')`,
      })
      .from(schema.accountPlan)
      .leftJoin(
        schema.accountBalances,
        and(
          eq(schema.accountBalances.accountPlanId, schema.accountPlan.id),
          eq(schema.accountBalances.tenantId, tenantId),
          eq(
            schema.accountBalances.accountingCyclesId,
            filters.accountingCycleId,
          ),
        ),
      )
      .where(eq(schema.accountPlan.tenantId, tenantId))
      .orderBy(asc(schema.accountPlan.code));

    const isIncome = type === 'income-statement';
    const movementRows: any[] = isIncome
      ? await this.getIncomeMovements(
          tenantId,
          previousStartStr,
          previousEndStr,
          currentStartStr,
          currentEndStr,
        )
      : await this.getBalanceMovements(
          tenantId,
          filters.accountingCycleId,
          currentStartStr,
          currentEndStr,
        );

    const movementMap = new Map<string, any>(
      movementRows.map((row) => [row.accountPlanId, row] as [string, any]),
    );

    const allowedTypes =
      type === 'financial-situation'
        ? ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']
        : type === 'income-statement'
          ? ['REVENUE', 'EXPENSE']
          : ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

    const allowedInitialDigits =
      type === 'financial-situation'
        ? ['1', '2', '3', '4', '5']
        : type === 'income-statement'
          ? ['4', '5']
          : ['1', '2', '3', '4', '5'];

    const nodes = new Map<
      string,
      {
        id: string;
        code: string;
        name: string;
        type: string;
        nature: string;
        parentId: string | null;
        previous: number;
        current: number;
        debit: number;
        credit: number;
      }
    >();

    for (const account of accounts) {
      const movement = movementMap.get(account.accountPlanId);
      const isDebitNature = account.accountNature === 'DEBIT';
      const naturalDelta = (debit: number, credit: number) =>
        isDebitNature ? debit - credit : credit - debit;
      const initial = Number(account.initialBalance) || 0;

      let previous = 0;
      let current = 0;
      let debit = 0;
      let credit = 0;

      if (isIncome) {
        previous = naturalDelta(
          Number(movement?.previousDebit) || 0,
          Number(movement?.previousCredit) || 0,
        );
        current = naturalDelta(
          Number(movement?.currentDebit) || 0,
          Number(movement?.currentCredit) || 0,
        );
      } else {
        const beforeDebit = Number(movement?.beforeDebit) || 0;
        const beforeCredit = Number(movement?.beforeCredit) || 0;
        const currentDebit = Number(movement?.currentDebit) || 0;
        const currentCredit = Number(movement?.currentCredit) || 0;

        if (type === 'financial-situation') {
          previous = initial + naturalDelta(beforeDebit, beforeCredit);
          current = previous + naturalDelta(currentDebit, currentCredit);
        } else {
          const initialSigned = isDebitNature ? initial : -initial;
          previous = initialSigned + beforeDebit - beforeCredit;
          current = previous + currentDebit - currentCredit;
          debit = currentDebit;
          credit = currentCredit;
        }
      }

      nodes.set(account.accountPlanId, {
        id: account.accountPlanId,
        code: account.accountCode,
        name: account.accountName,
        type: account.accountType,
        nature: account.accountNature,
        parentId: account.parentAccountId ?? null,
        previous,
        current,
        debit,
        credit,
      });
    }

    const getPrefix = (code: string): string => {
      const parts = code.split('.');
      if (parts.length !== 4) return code;

      const [first, second, third, fourth] = parts;

      if (second === '00' && third === '00' && fourth === '00') {
        if (first.endsWith('00')) return first.slice(0, 1);
        if (first.endsWith('0')) return first.slice(0, 2);
        return first;
      }
      if (third === '00' && fourth === '00') return `${first}.${second}`;
      if (fourth === '00') return `${first}.${second}.${third}`;
      return code;
    };

    const rows: SudecaRow[] = [];

    for (const node of nodes.values()) {
      if (node.code.split('.').length !== 4) continue;
      if (!allowedTypes.includes(node.type)) continue;
      if (!allowedInitialDigits.includes(node.code.charAt(0))) continue;

      const prefix = getPrefix(node.code);
      let previous = 0;
      let current = 0;
      let debit = 0;
      let credit = 0;

      for (const candidate of nodes.values()) {
        const matches = prefix.includes('.')
          ? candidate.code === prefix || candidate.code.startsWith(`${prefix}.`)
          : candidate.code.startsWith(prefix);

        if (!matches) continue;

        previous += candidate.previous;
        current += candidate.current;
        debit += candidate.debit;
        credit += candidate.credit;
      }

      if (
        type === 'trial-balance'
          ? previous === 0 && debit === 0 && credit === 0 && current === 0
          : previous === 0 && current === 0
      ) {
        continue;
      }

      rows.push({
        accountCode: node.code,
        accountName: node.name,
        previous: previous.toFixed(2),
        current: current.toFixed(2),
        variation: (current - previous).toFixed(2),
        ...(type === 'trial-balance'
          ? {
              debit: debit.toFixed(2),
              credit: credit.toFixed(2),
            }
          : {}),
      });
    }

    rows.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    return {
      type,
      title: TITLES[type],
      quarter,
      year,
      quarterLabel: `${MONTHS[currentEnd.getMonth()]} ${year}`,
      previousQuarterLabel: `${MONTHS[previousEnd.getMonth()]} ${previousEnd.getFullYear()}`,
      startDate: currentStartStr,
      endDate: currentEndStr,
      previousStartDate: previousStartStr,
      previousEndDate: previousEndStr,
      rows,
    };
  }

  async generatePdf(
    tenantId: string,
    type: SudecaReportType,
    filters: SudecaDto,
  ) {
    const data = await this.getData(tenantId, type, filters);
    const content = buildSudecaTableContent(type, data.rows);
    const title = `${data.title} TRIMESTRAL A: ${data.quarterLabel}`;

    return this.pdfService.generateReport(title, content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
      tenantId,
      headerStyle: 'sudeca',
      sector: 'PRIVADO',
      registrationNumber: '0',
    });
  }

  private async getBalanceMovements(
    tenantId: string,
    cycleId: string,
    currentStart: string,
    currentEnd: string,
  ) {
    return this.drizzle
      .select({
        accountPlanId: schema.accountingEntryDetails.accountPlanId,
        beforeDebit: sql<string>`COALESCE(SUM(CASE WHEN ${schema.accountingEntries.entryDate} < ${currentStart} THEN ${schema.accountingEntryDetails.debit} ELSE 0 END), 0)`,
        beforeCredit: sql<string>`COALESCE(SUM(CASE WHEN ${schema.accountingEntries.entryDate} < ${currentStart} THEN ${schema.accountingEntryDetails.credit} ELSE 0 END), 0)`,
        currentDebit: sql<string>`COALESCE(SUM(CASE WHEN ${schema.accountingEntries.entryDate} >= ${currentStart} THEN ${schema.accountingEntryDetails.debit} ELSE 0 END), 0)`,
        currentCredit: sql<string>`COALESCE(SUM(CASE WHEN ${schema.accountingEntries.entryDate} >= ${currentStart} THEN ${schema.accountingEntryDetails.credit} ELSE 0 END), 0)`,
      })
      .from(schema.accountingEntryDetails)
      .innerJoin(
        schema.accountingEntries,
        and(
          eq(
            schema.accountingEntries.id,
            schema.accountingEntryDetails.accountingEntryId,
          ),
          eq(schema.accountingEntries.tenantId, tenantId),
          eq(schema.accountingEntries.accountingCycleId, cycleId),
          eq(schema.accountingEntries.status, 'POSTED'),
          lte(schema.accountingEntries.entryDate, currentEnd),
          sql`${schema.accountingEntries.originType} IS DISTINCT FROM 'INITIAL_LOAD'`,
        ),
      )
      .groupBy(schema.accountingEntryDetails.accountPlanId);
  }

  private async getIncomeMovements(
    tenantId: string,
    previousStart: string,
    previousEnd: string,
    currentStart: string,
    currentEnd: string,
  ) {
    return this.drizzle
      .select({
        accountPlanId: schema.accountingEntryDetails.accountPlanId,
        previousDebit: sql<string>`COALESCE(SUM(CASE WHEN ${schema.accountingEntries.entryDate} >= ${previousStart} AND ${schema.accountingEntries.entryDate} <= ${previousEnd} THEN ${schema.accountingEntryDetails.debit} ELSE 0 END), 0)`,
        previousCredit: sql<string>`COALESCE(SUM(CASE WHEN ${schema.accountingEntries.entryDate} >= ${previousStart} AND ${schema.accountingEntries.entryDate} <= ${previousEnd} THEN ${schema.accountingEntryDetails.credit} ELSE 0 END), 0)`,
        currentDebit: sql<string>`COALESCE(SUM(CASE WHEN ${schema.accountingEntries.entryDate} >= ${currentStart} AND ${schema.accountingEntries.entryDate} <= ${currentEnd} THEN ${schema.accountingEntryDetails.debit} ELSE 0 END), 0)`,
        currentCredit: sql<string>`COALESCE(SUM(CASE WHEN ${schema.accountingEntries.entryDate} >= ${currentStart} AND ${schema.accountingEntries.entryDate} <= ${currentEnd} THEN ${schema.accountingEntryDetails.credit} ELSE 0 END), 0)`,
      })
      .from(schema.accountingEntryDetails)
      .innerJoin(
        schema.accountingEntries,
        and(
          eq(
            schema.accountingEntries.id,
            schema.accountingEntryDetails.accountingEntryId,
          ),
          eq(schema.accountingEntries.tenantId, tenantId),
          eq(schema.accountingEntries.status, 'POSTED'),
          gte(schema.accountingEntries.entryDate, previousStart),
          lte(schema.accountingEntries.entryDate, currentEnd),
          sql`${schema.accountingEntries.originType} IS DISTINCT FROM 'INITIAL_LOAD'`,
        ),
      )
      .groupBy(schema.accountingEntryDetails.accountPlanId);
  }

  private assertType(type: string): asserts type is SudecaReportType {
    if (!SUDECA_REPORT_TYPES.includes(type as SudecaReportType)) {
      throw new BadRequestException(`Tipo de reporte Sudeca inválido: ${type}`);
    }
  }

  private toDate(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(`${value}T12:00:00`);
  }

  private toDateString(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
