import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gte, lte } from 'drizzle-orm';
import { CreditQuotasReportDto } from '../dto/credit-quotas-report.dto';
import { buildCreditQuotasTableContent } from '../templates/pdf/credit-quotas.template';

@Injectable()
export class CreditQuotasReportService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  async generatePdf(tenantId: string, filters: CreditQuotasReportDto) {
    const conditions: any[] = [eq(schema.credits.tenantId, tenantId)];

    if (filters.reference) {
      conditions.push(
        eq(schema.credits.customReference, filters.reference),
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
        conditions.push(eq(schema.credits.associateId, associate.id));
      }
    }
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

    const rawData = await this.drizzle
      .select({
        cedula: schema.associates.cedula,
        fullname: schema.associates.fullname,
        reference: schema.credits.customReference,
        installmentNumber:
          schema.creditAmortizationSchedule.installmentNumber,
        dueDate: schema.creditAmortizationSchedule.dueDate,
        principalBalancePending:
          schema.creditAmortizationSchedule.principalBalancePending,
        paymentStatus: schema.creditAmortizationSchedule.paymentStatus,
      })
      .from(schema.creditAmortizationSchedule)
      .innerJoin(
        schema.credits,
        eq(schema.creditAmortizationSchedule.creditId, schema.credits.id),
      )
      .innerJoin(
        schema.associates,
        eq(schema.credits.associateId, schema.associates.id),
      )
      .where(and(...conditions))
      .orderBy(
        schema.associates.cedula,
        schema.creditAmortizationSchedule.installmentNumber,
      );

    const content = buildCreditQuotasTableContent(rawData);

    return this.pdfService.generateReport('CUOTAS DE CREDITOS', content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
    });
  }
}
