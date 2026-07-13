import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gte, lte, ne, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { VariationsReportDto } from '../dto/variations-report.dto';
import { buildVariationsTableContent } from '../templates/pdf/variations.template';

interface VariationRow {
  cedula: string;
  fullname: string;
  workerType: string | null;
  payrollCode: string | null;
  totalPayable: string | null;
  termUnits: number | null;
  installmentNumber: number;
  principalBalancePending: string;
}

@Injectable()
export class VariationsReportService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) { }

  async generatePdf(tenantId: string, filters: VariationsReportDto) {
    const [creditRows, loanRows] = await Promise.all([
      this.queryCredits(tenantId, filters),
      this.queryLoans(tenantId, filters),
    ]);

    const rawData = [...creditRows, ...loanRows].sort((a, b) => {
      const cedulaCmp = a.cedula.localeCompare(b.cedula);
      if (cedulaCmp !== 0) return cedulaCmp;
      return a.installmentNumber - b.installmentNumber;
    });

    const content = buildVariationsTableContent(rawData);

    return this.pdfService.generateReport(
      'CUOTAS POR COBRAR PRESTAMOS A SOCIO',
      content,
      { orientation: 'landscape', pageSize: 'LETTER' },
    );
  }

  private async queryCredits(
    tenantId: string,
    filters: VariationsReportDto,
  ): Promise<VariationRow[]> {
    const associateTypeCat = alias(schema.categories, 'associate_type');
    const payrollTypeCat = alias(schema.categories, 'payroll_type');

    const conditions: any[] = [
      eq(schema.credits.tenantId, tenantId),
      or(
        eq(schema.credits.status, 'APPROVED'),
        eq(schema.credits.status, 'IN_PAYMENT'),
      ),
    ];

    if (filters.dateFrom) {
      conditions.push(
        gte(schema.creditAmortizationSchedule.dueDate, filters.dateFrom),
      );
    }
    if (filters.dateTo) {
      conditions.push(
        lte(schema.creditAmortizationSchedule.dueDate, filters.dateTo),
      );
    }

    conditions.push(
      ne(schema.creditAmortizationSchedule.paymentStatus, 'PAID'),
      ne(schema.creditAmortizationSchedule.paymentStatus, 'DONE'),
      ne(schema.creditAmortizationSchedule.paymentStatus, 'CANCELED'),
    );

    return await this.drizzle
      .select({
        cedula: schema.associates.cedula,
        fullname: schema.associates.fullname,
        workerType: associateTypeCat.name,
        payrollCode: payrollTypeCat.code,
        totalPayable: schema.credits.totalPayable,
        termUnits: schema.credits.termUnits,
        installmentNumber:
          schema.creditAmortizationSchedule.installmentNumber,
        principalBalancePending:
          schema.creditAmortizationSchedule.principalBalancePending,
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
      .innerJoin(
        schema.creditAmortizationSchedule,
        eq(schema.credits.id, schema.creditAmortizationSchedule.creditId),
      )
      .where(and(...conditions));
  }

  private async queryLoans(
    tenantId: string,
    filters: VariationsReportDto,
  ): Promise<VariationRow[]> {
    const associateTypeCat = alias(schema.categories, 'associate_type_loan');
    const payrollTypeCat = alias(schema.categories, 'payroll_type_loan');

    const conditions: any[] = [
      eq(schema.loans.tenantId, tenantId),
      or(
        eq(schema.loans.status, 'DISBURSED'),
        eq(schema.loans.status, 'IN_PAYMENT'),
      ),
    ];

    if (filters.dateFrom) {
      conditions.push(
        gte(schema.loanAmortizationSchedule.dueDate, filters.dateFrom),
      );
    }
    if (filters.dateTo) {
      conditions.push(
        lte(schema.loanAmortizationSchedule.dueDate, filters.dateTo),
      );
    }

    conditions.push(
      ne(schema.loanAmortizationSchedule.paymentStatus, 'PAID'),
      ne(schema.loanAmortizationSchedule.paymentStatus, 'DONE'),
      ne(schema.loanAmortizationSchedule.paymentStatus, 'CANCELED'),
    );

    return await this.drizzle
      .select({
        cedula: schema.associates.cedula,
        fullname: schema.associates.fullname,
        workerType: associateTypeCat.name,
        payrollCode: payrollTypeCat.code,
        totalPayable: schema.loans.totalPayable,
        termUnits: schema.loans.termUnits,
        installmentNumber:
          schema.loanAmortizationSchedule.installmentNumber,
        principalBalancePending:
          schema.loanAmortizationSchedule.principalBalancePending,
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
      .innerJoin(
        schema.loanAmortizationSchedule,
        eq(schema.loans.id, schema.loanAmortizationSchedule.loanId),
      )
      .where(and(...conditions));
  }
}
