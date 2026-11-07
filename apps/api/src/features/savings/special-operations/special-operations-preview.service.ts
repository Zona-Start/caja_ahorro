import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { SavingsLiquidationService } from '@/features/savings/settlement/liquidation.service';
import { SettlementAssociateService } from '@/features/savings/settlement/settlement-associate.service';
import { type LiquidationWithdrawalLine } from '@/features/savings/settlement/settlement-associate-accounting.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { and, eq, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as ExcelJS from 'exceljs';
import { SpecialOperationType } from './dto/special-operations.schema';
import {
  buildCreditRole,
  buildLoanRole,
  buildWithdrawalRole,
} from './special-operations-roles';

type SpecialOperationRole = {
  role: string;
  label: string;
  total: number;
  defaultMovementType: 'DEBIT' | 'CREDIT';
  required: boolean;
  /** Indica si el rol permite marcar auxiliar socio. */
  defaultIsAuxiliary: boolean;
};

type PreviewRow = {
  rowNumber: number;
  cedula: string;
  associateId: string | null;
  associateAccountId: string | null;
  fullname: string;
  date?: string;
  status: 'OK' | 'ERROR';
  error?: string;
  amounts: Record<string, number>;
  display: Record<string, number>;
  breakdown: {
    withdrawals: Array<{
      type: string;
      amount: number;
      isSpecial: boolean;
    }>;
    loans: Array<{ type: string; amount: number }>;
    credits: Array<{ type: string; amount: number }>;
  };
};

type ParsedRow = {
  rowNumber: number;
  cedula: string;
  date?: Date;
};

@Injectable()
export class SpecialOperationsPreviewService {
  private readonly logger = new Logger(
    SpecialOperationsPreviewService.name,
  );

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly liquidationService: SavingsLiquidationService,
    private readonly settlementService: SettlementAssociateService,
  ) {}

  async preview(
    tenantId: string,
    operationType: SpecialOperationType,
    file: Express.Multer.File,
    operationDate?: Date,
  ) {
    const rows = await this.parseWorkbook(file);
    const baseDate = operationDate ?? new Date();

    const seen = new Map<string, number>();
    const seenAssociateIds = new Map<string, number>();
    const previewRows: PreviewRow[] = [];

    for (const row of rows) {
      const normalized = this.normalizeCedula(row.cedula);

      if (!normalized) {
        previewRows.push(
          this.errorRow(row, 'La cédula está vacía o no es válida.'),
        );
        continue;
      }

      const duplicate = seen.get(normalized);
      if (duplicate) {
        previewRows.push(
          this.errorRow(
            row,
            `Cédula duplicada. Ya fue cargada en la fila ${duplicate}.`,
          ),
        );
        continue;
      }
      seen.set(normalized, row.rowNumber);

      try {
        const associate = await this.resolveAssociate(
          tenantId,
          normalized,
          row.cedula,
        );

        if (!associate) {
          throw new BadRequestException(
            `No existe un asociado con la cédula ${row.cedula}.`,
          );
        }

        const duplicateAssociate = seenAssociateIds.get(associate.id);
        if (duplicateAssociate) {
          previewRows.push(
            this.errorRow(
              row,
              `El asociado ${associate.cedula} ya fue cargado en la fila ${duplicateAssociate}.`,
            ),
          );
          continue;
        }
        seenAssociateIds.set(associate.id, row.rowNumber);

        if (associate.status === 'INACTIVE') {
          throw new BadRequestException(
            `El asociado con cédula ${associate.cedula} está inactivo.`,
          );
        }

        if (associate.status === 'RETIRED') {
          throw new BadRequestException(
            `El asociado con cédula ${associate.cedula} está retirado.`,
          );
        }

        const liquidation =
          await this.liquidationService.calculateAssociateLiquidation(
            associate.cedula,
            tenantId,
          );

        const rowDate = row.date ?? baseDate;
        let preview: PreviewRow;

        // El desglose por tipo de préstamo/crédito se usa en ambas operaciones.
        const debtBreakdown =
          await this.liquidationService.getAssociateDebtBreakdown(
            liquidation.associate_id,
            tenantId,
          );

        if (operationType === 'LIQUIDATION_VS_INCOME') {
          const withdrawalLines =
            await this.settlementService.getWithdrawalAccountingLines(
              tenantId,
              liquidation.associate_account_id,
            );

          preview = this.buildLiquidationRow(
            row,
            liquidation,
            rowDate,
            withdrawalLines,
            debtBreakdown,
          );
        } else {
          preview = this.buildLoanWithdrawalRow(
            row,
            liquidation,
            rowDate,
            debtBreakdown,
          );
        }

        previewRows.push(preview);
      } catch (error) {
        previewRows.push(
          this.errorRow(
            row,
            error instanceof Error
              ? error.message
              : 'Error desconocido al calcular la operación.',
          ),
        );
      }
    }

    const validRows = previewRows.filter((row) => row.status === 'OK');
    const errorRows = previewRows.filter((row) => row.status === 'ERROR');
    const roles = this.buildRoles(operationType, validRows);
    const totals = this.buildTotals(operationType, validRows);

    return {
      operationType,
      operationDate: baseDate,
      rows: previewRows,
      totals,
      roles,
      summary: {
        totalRows: previewRows.length,
        validRows: validRows.length,
        errorRows: errorRows.length,
      },
    };
  }

  private buildLiquidationRow(
    row: ParsedRow,
    liquidation: Awaited<
      ReturnType<SavingsLiquidationService['calculateAssociateLiquidation']>
    >,
    date: Date,
    withdrawalLines: LiquidationWithdrawalLine[],
    debtBreakdown: {
      loans: Array<{ typeName: string; amount: number }>;
      credits: Array<{ typeName: string; amount: number }>;
    },
  ): PreviewRow {
    const retiros =
      Math.abs(Number(liquidation.total_withdrawals ?? 0)) +
      Math.abs(Number(liquidation.total_withdrawal_fees ?? 0));
    const prestamos = Number(liquidation.total_outstanding_loans ?? 0);
    const creditos = Number(liquidation.total_outstanding_credits ?? 0);
    const saldoFavor = Number(liquidation.total_overpayment ?? 0);
    const montoLiquidar = Number(liquidation.net_liquidation_amount ?? 0);

    const withdrawalMap = new Map<
      string,
      { type: string; amount: number; isSpecial: boolean }
    >();

    for (const line of withdrawalLines) {
      if (line.overpayment) continue;
      const type = line.description?.trim() || 'RETIRO NO IDENTIFICADO';
      const current = withdrawalMap.get(type);
      if (current) {
        current.amount += Number(line.amount ?? 0);
        current.isSpecial = current.isSpecial || Boolean(line.isSpecial);
      } else {
        withdrawalMap.set(type, {
          type,
          amount: Number(line.amount ?? 0),
          isSpecial: Boolean(line.isSpecial),
        });
      }
    }

    const withdrawalBreakdown = Array.from(withdrawalMap.values());

    if (montoLiquidar < 0) {
      return {
        ...this.baseRow(row, liquidation),
        status: 'ERROR',
        error: `Las deudas superan los haberes. Faltan ${Math.abs(
          montoLiquidar,
        ).toFixed(2)} Bs.`,
        amounts: {},
        display: {},
        breakdown: { withdrawals: [], loans: [], credits: [] },
      };
    }

    const amounts: Record<string, number> = {
      HABERES_ASOCIADOS: Number(liquidation.haberes_contribution ?? 0),
      HABERES_PATRONO: Number(liquidation.haberes_employer ?? 0),
      HABERES_VOLUNTARIOS: Number(liquidation.haberes_voluntary ?? 0),
      EXCEDENTES: Number(liquidation.surpluses ?? 0),
      SALDO_A_FAVOR: saldoFavor,
      MONTO_A_LIQUIDAR: montoLiquidar,
    };

    for (const item of withdrawalBreakdown) {
      const role = buildWithdrawalRole(item.type);
      amounts[role] = (amounts[role] ?? 0) + item.amount;
    }

    for (const item of debtBreakdown.loans) {
      const role = buildLoanRole(item.typeName);
      amounts[role] = (amounts[role] ?? 0) + item.amount;
    }

    for (const item of debtBreakdown.credits) {
      const role = buildCreditRole(item.typeName);
      amounts[role] = (amounts[role] ?? 0) + item.amount;
    }

    return {
      ...this.baseRow(row, liquidation),
      date: date.toISOString().slice(0, 10),
      status: 'OK',
      amounts,
      display: {
        haberesPatrono: Number(liquidation.haberes_employer ?? 0),
        haberesAsociados: Number(liquidation.haberes_contribution ?? 0),
        excedentes: Number(liquidation.surpluses ?? 0),
        retiros,
        prestamos,
        creditos,
        saldoFavor,
        montoLiquidar,
      },
      breakdown: {
        withdrawals: withdrawalBreakdown,
        loans: debtBreakdown.loans.map((item) => ({
          type: item.typeName,
          amount: item.amount,
        })),
        credits: debtBreakdown.credits.map((item) => ({
          type: item.typeName,
          amount: item.amount,
        })),
      },
    };
  }

  private buildLoanWithdrawalRow(
    row: ParsedRow,
    liquidation: Awaited<
      ReturnType<SavingsLiquidationService['calculateAssociateLiquidation']>
    >,
    date: Date,
    debtBreakdown: {
      loans: Array<{ typeName: string; amount: number }>;
      credits: Array<{ typeName: string; amount: number }>;
    },
  ): PreviewRow {
    const haberesTotales = Number(liquidation.total_savings_balance ?? 0);
    const capitalPrestamos = debtBreakdown.loans.reduce(
      (total, item) => total + Number(item.amount ?? 0),
      0,
    );
    const capitalCreditos = debtBreakdown.credits.reduce(
      (total, item) => total + Number(item.amount ?? 0),
      0,
    );
    const deudaTotal = capitalPrestamos + capitalCreditos;

    if (deudaTotal <= 0) {
      return {
        ...this.baseRow(row, liquidation),
        status: 'ERROR',
        error:
          'El asociado no tiene préstamos ni créditos activos para cancelar.',
        amounts: {},
        display: {},
        breakdown: { withdrawals: [], loans: [], credits: [] },
      };
    }

    if (haberesTotales < deudaTotal) {
      return {
        ...this.baseRow(row, liquidation),
        status: 'ERROR',
        error: `Los haberes totales (${haberesTotales.toFixed(
          2,
        )} Bs) no alcanzan para pagar la deuda total (${deudaTotal.toFixed(
          2,
        )} Bs).`,
        amounts: {},
        display: {},
        breakdown: { withdrawals: [], loans: [], credits: [] },
      };
    }

    return {
      ...this.baseRow(row, liquidation),
      date: date.toISOString().slice(0, 10),
      status: 'OK',
      amounts: (() => {
        const amounts: Record<string, number> = {
          RETIRO_HABERES: deudaTotal,
        };

        for (const item of debtBreakdown.loans) {
          const role = buildLoanRole(item.typeName);
          amounts[role] = (amounts[role] ?? 0) + item.amount;
        }

        for (const item of debtBreakdown.credits) {
          const role = buildCreditRole(item.typeName);
          amounts[role] = (amounts[role] ?? 0) + item.amount;
        }

        return amounts;
      })(),
      display: {
        haberesTotales,
        capitalPrestamos,
        capitalCreditos,
        deudaTotal,
        montoDescontar: deudaTotal,
        saldoRestante: Number((haberesTotales - deudaTotal).toFixed(2)),
      },
      breakdown: {
        withdrawals: [],
        loans: debtBreakdown.loans.map((item) => ({
          type: item.typeName,
          amount: item.amount,
        })),
        credits: debtBreakdown.credits.map((item) => ({
          type: item.typeName,
          amount: item.amount,
        })),
      },
    };
  }

  private baseRow(
    row: ParsedRow,
    liquidation: Awaited<
      ReturnType<SavingsLiquidationService['calculateAssociateLiquidation']>
    >,
  ) {
    return {
      rowNumber: row.rowNumber,
      cedula: liquidation.cedula,
      associateId: liquidation.associate_id,
      associateAccountId: liquidation.associate_account_id,
      fullname: liquidation.fullname,
    };
  }

  private errorRow(row: ParsedRow, message: string): PreviewRow {
    return {
      rowNumber: row.rowNumber,
      cedula: row.cedula,
      associateId: null,
      associateAccountId: null,
      fullname: '',
      status: 'ERROR',
      error: message,
      amounts: {},
      display: {},
      breakdown: { withdrawals: [], loans: [], credits: [] },
    };
  }

  private buildRoles(
    operationType: SpecialOperationType,
    rows: PreviewRow[],
  ): SpecialOperationRole[] {
    if (operationType === 'LIQUIDATION_VS_INCOME') {
      const definitions = new Map<
        string,
        {
          role: string;
          label: string;
          defaultMovementType: 'DEBIT' | 'CREDIT';
          defaultIsAuxiliary: boolean;
        }
      >();

      const addDefinition = (
        role: string,
        label: string,
        defaultMovementType: 'DEBIT' | 'CREDIT',
        defaultIsAuxiliary = true,
      ) => {
        if (!definitions.has(role)) {
          definitions.set(role, {
            role,
            label,
            defaultMovementType,
            defaultIsAuxiliary,
          });
        }
      };

      // Haberes y conceptos base.
      addDefinition('HABERES_ASOCIADOS', 'Haberes asociados', 'DEBIT');
      addDefinition('HABERES_PATRONO', 'Haberes patrono', 'DEBIT');
      addDefinition(
        'HABERES_VOLUNTARIOS',
        'Haberes voluntarios',
        'DEBIT',
      );
      addDefinition('EXCEDENTES', 'Excedentes', 'DEBIT');

      // Roles dinámicos por tipo de retiro, préstamo y crédito.
      for (const row of rows) {
        for (const item of row.breakdown.withdrawals) {
          addDefinition(
            buildWithdrawalRole(item.type),
            `Retiro: ${item.type}`,
            'CREDIT',
          );
        }
        for (const item of row.breakdown.loans) {
          addDefinition(
            buildLoanRole(item.type),
            `Préstamo: ${item.type}`,
            'CREDIT',
          );
        }
        for (const item of row.breakdown.credits) {
          addDefinition(
            buildCreditRole(item.type),
            `Crédito: ${item.type}`,
            'CREDIT',
          );
        }
      }

      addDefinition('SALDO_A_FAVOR', 'Saldo a favor', 'DEBIT');
      addDefinition(
        'MONTO_A_LIQUIDAR',
        'Monto a liquidar',
        'CREDIT',
        false,
      );

      const baseRoles = [
        'HABERES_ASOCIADOS',
        'HABERES_PATRONO',
        'HABERES_VOLUNTARIOS',
        'EXCEDENTES',
      ];
      const dynamicRoles = Array.from(definitions.keys()).filter(
        (role) =>
          role.startsWith('RETIRO::') ||
          role.startsWith('PRESTAMO::') ||
          role.startsWith('CREDITO::'),
      );
      const orderedRoles = [
        ...baseRoles,
        ...dynamicRoles.filter((role) => role.startsWith('RETIRO::')),
        ...dynamicRoles.filter((role) => role.startsWith('PRESTAMO::')),
        ...dynamicRoles.filter((role) => role.startsWith('CREDITO::')),
        'SALDO_A_FAVOR',
        'MONTO_A_LIQUIDAR',
      ];

      return orderedRoles.map((role) => {
        const definition = definitions.get(role)!;
        const total = rows.reduce(
          (sum, row) => sum + Number(row.amounts[role] ?? 0),
          0,
        );

        return {
          ...definition,
          total,
          required: total !== 0,
        };
      });
    }

    const definitions = new Map<
      string,
      {
        role: string;
        label: string;
        defaultMovementType: 'DEBIT' | 'CREDIT';
        defaultIsAuxiliary: boolean;
      }
    >();

    const addDefinition = (
      role: string,
      label: string,
      defaultMovementType: 'DEBIT' | 'CREDIT',
      defaultIsAuxiliary = true,
    ) => {
      if (!definitions.has(role)) {
        definitions.set(role, {
          role,
          label,
          defaultMovementType,
          defaultIsAuxiliary,
        });
      }
    };

    addDefinition(
      'RETIRO_HABERES',
      'Retiro aplicado a deudas',
      'DEBIT',
      true,
    );

    for (const row of rows) {
      for (const item of row.breakdown.loans) {
        addDefinition(
          buildLoanRole(item.type),
          `Préstamo: ${item.type}`,
          'CREDIT',
          true,
        );
      }
      for (const item of row.breakdown.credits) {
        addDefinition(
          buildCreditRole(item.type),
          `Crédito: ${item.type}`,
          'CREDIT',
          true,
        );
      }
    }

    const dynamicRoles = Array.from(definitions.keys()).filter(
      (role) =>
        role.startsWith('PRESTAMO::') || role.startsWith('CREDITO::'),
    );
    const orderedRoles = [
      'RETIRO_HABERES',
      ...dynamicRoles.filter((role) => role.startsWith('PRESTAMO::')),
      ...dynamicRoles.filter((role) => role.startsWith('CREDITO::')),
    ];

    return orderedRoles.map((role) => {
      const definition = definitions.get(role)!;
      const total = rows.reduce(
        (sum, row) => sum + Number(row.amounts[role] ?? 0),
        0,
      );

      return {
        ...definition,
        total,
        required: total !== 0,
      };
    });
  }

  private buildTotals(
    operationType: SpecialOperationType,
    rows: PreviewRow[],
  ) {
    const sum = (key: string) =>
      rows.reduce((total, row) => total + Number(row.display[key] ?? 0), 0);

    if (operationType === 'LIQUIDATION_VS_INCOME') {
      return {
        haberesPatrono: sum('haberesPatrono'),
        haberesAsociados: sum('haberesAsociados'),
        excedentes: sum('excedentes'),
        retiros: sum('retiros'),
        prestamos: sum('prestamos'),
        creditos: sum('creditos'),
        saldoFavor: sum('saldoFavor'),
        montoLiquidar: sum('montoLiquidar'),
        totalOperacion: sum('montoLiquidar'),
      };
    }

    return {
      haberesTotales: sum('haberesTotales'),
      capitalPrestamos: sum('capitalPrestamos'),
      capitalCreditos: sum('capitalCreditos'),
      deudaTotal: sum('deudaTotal'),
      montoDescontar: sum('montoDescontar'),
      saldoRestante: sum('saldoRestante'),
      totalOperacion: sum('montoDescontar'),
    };
  }

  private async parseWorkbook(
    file: Express.Multer.File,
  ): Promise<ParsedRow[]> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('El archivo Excel está vacío.');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new BadRequestException(
        'El archivo no contiene una hoja válida.',
      );
    }

    const headerRow = worksheet.getRow(1);
    let cedulaColumn = 1;
    let fechaColumn = 2;

    headerRow.eachCell((cell, columnNumber) => {
      const value = String(cell.value ?? '')
        .trim()
        .toLowerCase();
      if (value === 'cedula' || value === 'cédula') {
        cedulaColumn = columnNumber;
      }
      if (value === 'fecha') {
        fechaColumn = columnNumber;
      }
    });

    const rows: ParsedRow[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const cedula = String(row.getCell(cedulaColumn).value ?? '').trim();
      if (!cedula) return;

      const rawDate = row.getCell(fechaColumn).value;
      const date = this.parseDate(rawDate);

      rows.push({
        rowNumber,
        cedula,
        date: date ?? undefined,
      });
    });

    if (!rows.length) {
      throw new BadRequestException(
        'No se encontraron filas con cédula en el archivo.',
      );
    }

    return rows;
  }

  private parseDate(raw: any): Date | null {
    if (raw === null || raw === undefined || raw === '') return null;
    if (raw instanceof Date) {
      return Number.isNaN(raw.getTime()) ? null : raw;
    }

    if (typeof raw === 'object' && raw !== null) {
      if ('result' in raw) return this.parseDate(raw.result);
      if ('richText' in raw) {
        return this.parseDate(
          raw.richText.map((part: any) => part.text).join(''),
        );
      }
    }

    const numeric = Number(raw);
    if (!Number.isNaN(numeric) && numeric > 20000) {
      const date = new Date(
        Math.round((numeric - 25569) * 86400 * 1000),
      );
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(String(raw));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private normalizeCedula(value: string): string {
    return value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
  }

  private async resolveAssociate(
    tenantId: string,
    normalized: string,
    original: string,
  ) {
    const digits = original.replace(/\D/g, '');
    const variants = new Set<string>([
      original.trim(),
      normalized,
      digits,
      `V${digits}`,
      `V-${digits}`,
      `E${digits}`,
      `E-${digits}`,
    ]);

    const conditions = Array.from(variants)
      .filter(Boolean)
      .map((variant) => eq(schema.associates.cedula, variant));

    const [associate] = await this.db
      .select({
        id: schema.associates.id,
        cedula: schema.associates.cedula,
        fullname: schema.associates.fullname,
        status: schema.associates.status,
      })
      .from(schema.associates)
      .where(
        and(
          eq(schema.associates.tenantId, tenantId),
          or(...conditions),
        ),
      )
      .limit(1);

    return associate ?? null;
  }
}
