import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { alias } from 'drizzle-orm/pg-core';
import * as ExcelJS from 'exceljs';
import {
  buildVariationsTableContent,
  type VariationInstrumentType,
  type VariationReportRow,
  type VariationStatus,
} from '../templates/pdf/variations.template';

interface RawVariationRow {
  cedula: string;
  fullname: string;
  workerType: string | null;
  typeName: string | null;
  payrollCode: string | null;
  totalPayable: string | null;
  termUnits: number | null;
  installmentAmount: string | null;
  status: string;
  baseSalary: string | null;
  pendingAmount: string | null;
  scheduleCount: string | null;
}

const LOAN_STATUS_MAP: Record<string, VariationStatus> = {
  DISBURSED: 'INCLUSION',
  IN_PAYMENT: 'VARIACION',
  PAID: 'EXCLUSION',
};

const CREDIT_STATUS_MAP: Record<string, VariationStatus> = {
  APPROVED: 'INCLUSION',
  IN_PAYMENT: 'VARIACION',
  PAID: 'EXCLUSION',
};

const STATUS_ORDER: Record<VariationStatus, number> = {
  INCLUSION: 0,
  VARIACION: 1,
  EXCLUSION: 2,
};

/**
 * Códigos de descuento que debe mostrar el reporte según el tipo de
 * préstamo/crédito. Se normaliza el nombre del tipo para evitar diferencias
 * de mayúsculas o espacios.
 */
const TYPE_CODE_MAP: Record<string, string> = {
  'PRESTAMOS PERSONALES (CP)': '5022',
  'CREDITOS COMERCIALES': '5025',
  'JORNADA SALUD': '5027',
};

@Injectable()
export class VariationsReportService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  async generatePdf(tenantId: string) {
    const rows = await this.getRows(tenantId);
    const content = buildVariationsTableContent(rows);

    return this.pdfService.generateReport(
      'VARIACIONES - PRÉSTAMOS Y CRÉDITOS',
      content,
      { orientation: 'landscape', pageSize: 'LETTER' },
    );
  }

  async generateExcel(tenantId: string): Promise<Buffer> {
    const rows = await this.getRows(tenantId);
    return this.buildExcel(rows);
  }

  private async getRows(tenantId: string): Promise<VariationReportRow[]> {
    const [creditRows, loanRows] = await Promise.all([
      this.queryCredits(tenantId),
      this.queryLoans(tenantId),
    ]);

    return [...creditRows, ...loanRows].sort((a, b) => {
      const statusCmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (statusCmp !== 0) return statusCmp;

      const cedulaCmp = a.cedula.localeCompare(b.cedula, 'es');
      if (cedulaCmp !== 0) return cedulaCmp;

      const typeCmp = a.instrumentType.localeCompare(b.instrumentType);
      if (typeCmp !== 0) return typeCmp;

      return a.fullname.localeCompare(b.fullname, 'es');
    });
  }

  private async buildExcel(rows: VariationReportRow[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Zona Start';
    workbook.created = new Date();
    workbook.modified = new Date();

    const columnCount = 12;
    const headers = [
      'CÉDULA',
      'NOMBRE Y APELLIDOS',
      'TIPO PERSONAL',
      'TIPO PRÉSTAMO',
      'OPERACIÓN',
      'MONTO PRÉSTAMO',
      'CANT. CUOTAS',
      'MONTO CUOTA',
      'VARIACIÓN',
      'PENDIENTE',
      'CAPACIDAD',
      'CUOTA ACTUALIZADA',
    ];

    const sheet = workbook.addWorksheet('Variaciones', {
      views: [{ state: 'frozen', ySplit: 3 }],
      pageSetup: {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        printTitlesRow: '3:3',
      },
    });

    sheet.mergeCells(1, 1, 1, columnCount);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = 'VARIACIONES - PRÉSTAMOS Y CRÉDITOS';
    titleCell.font = {
      bold: true,
      size: 14,
      color: { argb: 'FF1F497D' },
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 24;

    sheet.mergeCells(2, 1, 2, columnCount);
    const subtitleCell = sheet.getCell(2, 1);
    subtitleCell.value = `Solo operaciones en VES | Generado: ${new Date().toLocaleString('es-VE')}`;
    subtitleCell.font = {
      italic: true,
      size: 9,
      color: { argb: 'FF666666' },
    };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const headerRow = sheet.getRow(3);
    headerRow.values = headers;
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F497D' },
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      };
    });

    const statusStyles: Record<
      VariationStatus,
      { fill: string; font: string }
    > = {
      INCLUSION: { fill: 'FFE2EFDA', font: 'FF375623' },
      VARIACION: { fill: 'FFFFF2CC', font: 'FF7F6000' },
      EXCLUSION: { fill: 'FFFCE4E4', font: 'FF9C0006' },
    };

    rows.forEach((row) => {
      const excelRow = sheet.addRow([
        row.cedula,
        row.fullname,
        row.workerType ?? '',
        row.payrollCode ?? '',
        row.instrumentType === 'LOAN' ? 'PRÉSTAMO' : 'CRÉDITO',
        this.toNumber(row.totalPayable),
        row.termUnits,
        this.toNumber(row.installmentAmount),
        row.status,
        this.toNumber(row.pendingAmount),
        this.toNumber(row.paymentCapacity),
        row.updatedQuota,
      ]);

      excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal:
            colNumber === 2 || colNumber === 3
              ? 'left'
              : colNumber === 1 ||
                  colNumber === 4 ||
                  colNumber === 5 ||
                  colNumber === 7 ||
                  colNumber === 9 ||
                  colNumber === 12
                ? 'center'
                : 'right',
        };
      });

      const statusStyle = statusStyles[row.status];
      const statusCell = excelRow.getCell(9);
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: statusStyle.fill },
      };
      statusCell.font = {
        bold: true,
        color: { argb: statusStyle.font },
      };
    });

    sheet.getColumn(1).width = 14;
    sheet.getColumn(1).numFmt = '@';
    sheet.getColumn(2).width = 38;
    sheet.getColumn(3).width = 22;
    sheet.getColumn(4).width = 14;
    sheet.getColumn(5).width = 14;
    sheet.getColumn(6).width = 18;
    sheet.getColumn(6).numFmt = '#,##0.00';
    sheet.getColumn(7).width = 12;
    sheet.getColumn(7).numFmt = '0';
    sheet.getColumn(8).width = 16;
    sheet.getColumn(8).numFmt = '#,##0.00';
    sheet.getColumn(9).width = 16;
    sheet.getColumn(10).width = 16;
    sheet.getColumn(10).numFmt = '#,##0.00';
    sheet.getColumn(11).width = 16;
    sheet.getColumn(11).numFmt = '#,##0.00';
    sheet.getColumn(12).width = 18;
    sheet.getColumn(12).numFmt = '0';

    sheet.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 3, column: columnCount },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

  private async queryLoans(tenantId: string): Promise<VariationReportRow[]> {
    const associateTypeCat = alias(
      schema.categories,
      'associate_type_variation_loan',
    );
    const payrollTypeCat = alias(
      schema.categories,
      'payroll_type_variation_loan',
    );

    const rows = await this.drizzle
      .select({
        cedula: schema.associates.cedula,
        fullname: schema.associates.fullname,
        workerType: associateTypeCat.name,
        typeName: schema.loanTypes.name,
        payrollCode: payrollTypeCat.code,
        totalPayable: schema.loans.totalPayable,
        termUnits: schema.loans.termUnits,
        installmentAmount: schema.loans.installmentAmount,
        status: schema.loans.status,
        baseSalary: schema.associates.baseSalary,
        pendingAmount: sql<string>`COALESCE((
          SELECT SUM(
            CASE
              WHEN ${schema.loanAmortizationSchedule.paymentStatus}::text IN ('PAID', 'DONE', 'CANCELED') THEN 0
              ELSE ${schema.loanAmortizationSchedule.totalInstallmentAmount} - COALESCE(${schema.loanAmortizationSchedule.paidAmount}, 0)
            END
          )
          FROM ${schema.loanAmortizationSchedule}
          WHERE ${schema.loanAmortizationSchedule.loanId} = ${schema.loans.id}
        ), 0)`,
        scheduleCount: sql<string>`(
          SELECT COUNT(*)
          FROM ${schema.loanAmortizationSchedule}
          WHERE ${schema.loanAmortizationSchedule.loanId} = ${schema.loans.id}
        )`,
      })
      .from(schema.loans)
      .innerJoin(
        schema.associates,
        eq(schema.loans.associateId, schema.associates.id),
      )
      .leftJoin(
        associateTypeCat,
        eq(schema.associates.associatedTypeId, associateTypeCat.id),
      )
      .leftJoin(
        schema.loanTypes,
        eq(schema.loans.loanTypeId, schema.loanTypes.id),
      )
      .leftJoin(
        payrollTypeCat,
        eq(schema.loanTypes.payrollTypeId, payrollTypeCat.id),
      )
      .where(
        and(
          eq(schema.loans.tenantId, tenantId),
          inArray(schema.loans.status, [
            'DISBURSED',
            'IN_PAYMENT',
            'PAID',
          ]),
          or(
            eq(schema.loans.currencyCode, 'VES'),
            isNull(schema.loans.currencyCode),
          ),
        ),
      );

    return rows.map((row) => this.mapRow(row, 'LOAN', LOAN_STATUS_MAP));
  }

  private async queryCredits(tenantId: string): Promise<VariationReportRow[]> {
    const associateTypeCat = alias(
      schema.categories,
      'associate_type_variation_credit',
    );
    const payrollTypeCat = alias(
      schema.categories,
      'payroll_type_variation_credit',
    );

    const rows = await this.drizzle
      .select({
        cedula: schema.associates.cedula,
        fullname: schema.associates.fullname,
        workerType: associateTypeCat.name,
        typeName: schema.creditsTypes.name,
        payrollCode: payrollTypeCat.code,
        totalPayable: schema.credits.totalPayable,
        termUnits: schema.credits.termUnits,
        installmentAmount: schema.credits.installmentAmount,
        status: schema.credits.status,
        baseSalary: schema.associates.baseSalary,
        pendingAmount: sql<string>`COALESCE((
          SELECT SUM(
            CASE
              WHEN ${schema.creditAmortizationSchedule.paymentStatus}::text IN ('PAID', 'DONE', 'CANCELED') THEN 0
              ELSE ${schema.creditAmortizationSchedule.totalInstallmentAmount} - COALESCE(${schema.creditAmortizationSchedule.paidAmount}, 0)
            END
          )
          FROM ${schema.creditAmortizationSchedule}
          WHERE ${schema.creditAmortizationSchedule.creditId} = ${schema.credits.id}
        ), 0)`,
        scheduleCount: sql<string>`(
          SELECT COUNT(*)
          FROM ${schema.creditAmortizationSchedule}
          WHERE ${schema.creditAmortizationSchedule.creditId} = ${schema.credits.id}
        )`,
      })
      .from(schema.credits)
      .innerJoin(
        schema.associates,
        eq(schema.credits.associateId, schema.associates.id),
      )
      .leftJoin(
        associateTypeCat,
        eq(schema.associates.associatedTypeId, associateTypeCat.id),
      )
      .leftJoin(
        schema.creditsTypes,
        eq(schema.credits.creditTypeId, schema.creditsTypes.id),
      )
      .leftJoin(
        payrollTypeCat,
        eq(schema.creditsTypes.payrollTypeId, payrollTypeCat.id),
      )
      .where(
        and(
          eq(schema.credits.tenantId, tenantId),
          inArray(schema.credits.status, ['APPROVED', 'IN_PAYMENT', 'PAID']),
          or(
            eq(schema.credits.currencyCode, 'VES'),
            isNull(schema.credits.currencyCode),
          ),
        ),
      );

    return rows.map((row) => this.mapRow(row, 'CREDIT', CREDIT_STATUS_MAP));
  }

  private mapRow(
    row: RawVariationRow,
    instrumentType: VariationInstrumentType,
    statusMap: Record<string, VariationStatus>,
  ): VariationReportRow {
    const status = statusMap[row.status];

    if (!status) {
      throw new Error(`Estado no soportado en el reporte: ${row.status}`);
    }

    const totalPayable = this.toNumber(row.totalPayable);
    const scheduleCount = Number(row.scheduleCount ?? 0);
    const pendingFromSchedule = this.toNumber(row.pendingAmount) ?? 0;
    const pending =
      scheduleCount > 0
        ? pendingFromSchedule
        : row.status === 'PAID'
          ? 0
          : (totalPayable ?? 0);

    const baseSalary = this.toNumber(row.baseSalary);
    const capacity = baseSalary !== null ? baseSalary * 0.3 : null;

    const isExclusion = status === 'EXCLUSION';
    const updatedQuota =
      !isExclusion && capacity !== null && capacity > 0 && pending > 0
        ? Math.ceil(pending / capacity)
        : null;

    const installmentAmount =
      row.installmentAmount ??
      (totalPayable !== null && row.termUnits
        ? (totalPayable / row.termUnits).toFixed(2)
        : null);

    const normalizedTypeName = row.typeName?.trim().toUpperCase() ?? '';
    const payrollCode =
      TYPE_CODE_MAP[normalizedTypeName] ?? row.payrollCode;

    return {
      cedula: row.cedula,
      fullname: row.fullname,
      workerType: row.workerType,
      payrollCode,
      instrumentType,
      totalPayable: row.totalPayable,
      termUnits: isExclusion ? null : row.termUnits,
      installmentAmount: isExclusion ? null : installmentAmount,
      status,
      pendingAmount: isExclusion ? null : pending.toFixed(2),
      paymentCapacity:
        isExclusion || capacity === null ? null : capacity.toFixed(2),
      updatedQuota: isExclusion ? null : updatedQuota,
    };
  }

  private toNumber(value: string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
}
