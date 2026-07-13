import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gte, lte } from 'drizzle-orm';
import { LoansReportDto } from '../dto/loans-report.dto';
import { buildLoansTableContent } from '../templates/pdf/loans.template';

@Injectable()
export class LoansReportService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  async generatePdf(tenantId: string, filters: LoansReportDto) {
    const conditions: any[] = [eq(schema.loans.tenantId, tenantId)];

    if (filters.loanTypeId) {
      conditions.push(eq(schema.loans.loanTypeId, filters.loanTypeId));
    }
    if (filters.dateFrom) {
      conditions.push(gte(schema.loans.requestDate, filters.dateFrom));
    }
    if (filters.dateTo) {
      conditions.push(lte(schema.loans.requestDate, filters.dateTo));
    }

    const rawData = await this.drizzle
      .select({
        requestDate: schema.loans.requestDate,
        reference: schema.loans.customReference,
        cedula: schema.associates.cedula,
        fullname: schema.associates.fullname,
        loanType: schema.loanTypes.name,
        requestedAmount: schema.loans.requestedAmount,
        totalPayable: schema.loans.totalPayable,
        termUnits: schema.loans.termUnits,
        status: schema.loans.status,
      })
      .from(schema.loans)
      .innerJoin(
        schema.associates,
        eq(schema.loans.associateId, schema.associates.id),
      )
      .leftJoin(
        schema.loanTypes,
        eq(schema.loans.loanTypeId, schema.loanTypes.id),
      )
      .where(and(...conditions))
      .orderBy(schema.loans.requestDate, schema.associates.cedula);

    const content = buildLoansTableContent(rawData);

    return this.pdfService.generateReport('PRESTAMOS', content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
    });
  }
}
