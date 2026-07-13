import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gte, lte } from 'drizzle-orm';
import { QuotasReportDto } from '../dto/quotas-report.dto';
import { buildQuotasTableContent } from '../templates/pdf/quotas.template';

@Injectable()
export class QuotasReportService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  async generatePdf(tenantId: string, filters: QuotasReportDto) {
    const conditions: any[] = [eq(schema.loans.tenantId, tenantId)];

    if (filters.reference) {
      conditions.push(
        eq(schema.loans.customReference, filters.reference),
      );
    }
    if (filters.cedula) {
      const [associate] = await this.drizzle
        .select({ id: schema.associates.id })
        .from(schema.associates)
        .where(
          and(
            eq(schema.associates.tenantId, tenantId),
            eq(schema.associates.cedula, filters.cedula),
          ),
        )
        .limit(1);

      if (associate) {
        conditions.push(eq(schema.loans.associateId, associate.id));
      }
    }
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

    const rawData = await this.drizzle
      .select({
        cedula: schema.associates.cedula,
        fullname: schema.associates.fullname,
        reference: schema.loans.customReference,
        installmentNumber:
          schema.loanAmortizationSchedule.installmentNumber,
        dueDate: schema.loanAmortizationSchedule.dueDate,
        principalBalancePending:
          schema.loanAmortizationSchedule.principalBalancePending,
        paymentStatus: schema.loanAmortizationSchedule.paymentStatus,
      })
      .from(schema.loanAmortizationSchedule)
      .innerJoin(
        schema.loans,
        eq(schema.loanAmortizationSchedule.loanId, schema.loans.id),
      )
      .innerJoin(
        schema.associates,
        eq(schema.loans.associateId, schema.associates.id),
      )
      .where(and(...conditions))
      .orderBy(
        schema.associates.cedula,
        schema.loanAmortizationSchedule.installmentNumber,
      );

    const content = buildQuotasTableContent(rawData);

    return this.pdfService.generateReport('CUOTAS DE PRESTAMOS', content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
    });
  }
}
