import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gte, lte } from 'drizzle-orm';
import { CreditsReportDto } from '../dto/credits-report.dto';
import { buildCreditsTableContent } from '../templates/pdf/credits.template';

@Injectable()
export class CreditsReportService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  async generatePdf(tenantId: string, filters: CreditsReportDto) {
    const conditions: any[] = [eq(schema.credits.tenantId, tenantId)];

    if (filters.creditTypeId) {
      conditions.push(eq(schema.credits.creditTypeId, filters.creditTypeId));
    }
    if (filters.dateFrom) {
      conditions.push(gte(schema.credits.requestDate, filters.dateFrom));
    }
    if (filters.dateTo) {
      conditions.push(lte(schema.credits.requestDate, filters.dateTo));
    }

    const rawData = await this.drizzle
      .select({
        requestDate: schema.credits.requestDate,
        reference: schema.credits.customReference,
        cedula: schema.associates.cedula,
        fullname: schema.associates.fullname,
        creditType: schema.creditsTypes.name,
        requestedAmount: schema.credits.requestedAmount,
        totalPayable: schema.credits.totalPayable,
        termUnits: schema.credits.termUnits,
        status: schema.credits.status,
      })
      .from(schema.credits)
      .innerJoin(
        schema.associates,
        eq(schema.credits.associateId, schema.associates.id),
      )
      .leftJoin(
        schema.creditsTypes,
        eq(schema.credits.creditTypeId, schema.creditsTypes.id),
      )
      .where(and(...conditions))
      .orderBy(schema.credits.requestDate, schema.associates.cedula);

    const content = buildCreditsTableContent(rawData);

    return this.pdfService.generateReport('CREDITOS', content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
    });
  }
}
