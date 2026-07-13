import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gte, lte } from 'drizzle-orm';
import { HaberesReportDto } from '../dto/haberes-report.dto';
import { buildHaberesTableContent } from '../templates/pdf/haberes.template';

@Injectable()
export class HaberesReportService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  async generatePdf(tenantId: string, filters: HaberesReportDto) {
    const conditions: any[] = [
      eq(schema.contributionBatches.tenantId, tenantId),
    ];

    if (filters.type) {
      conditions.push(
        eq(schema.contributionBatches.type, filters.type as any),
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
        conditions.push(
          eq(schema.contributionBatchAssociates.associateId, associate.id),
        );
      }
    }
    if (filters.dateFrom) {
      conditions.push(
        gte(schema.contributionBatches.entryDate, filters.dateFrom),
      );
    }
    if (filters.dateTo) {
      conditions.push(
        lte(schema.contributionBatches.entryDate, filters.dateTo),
      );
    }

    const rawData = await this.drizzle
      .select({
        entryDate: schema.contributionBatches.entryDate,
        type: schema.contributionBatches.type,
        movementType: schema.contributionBatches.movementType,
        description: schema.contributionBatches.description,
        totalAmount: schema.contributionBatches.totalAmount,
        associateCount: schema.contributionBatches.associateCount,
        batchStatus: schema.contributionBatches.status,
        associateFullname: schema.associates.fullname,
        associateCedula: schema.associates.cedula,
        associateAmount: schema.contributionBatchAssociates.amount,
      })
      .from(schema.contributionBatches)
      .leftJoin(
        schema.contributionBatchAssociates,
        eq(
          schema.contributionBatches.id,
          schema.contributionBatchAssociates.contributionBatchId,
        ),
      )
      .leftJoin(
        schema.associates,
        eq(
          schema.contributionBatchAssociates.associateId,
          schema.associates.id,
        ),
      )
      .where(and(...conditions));

    const content = buildHaberesTableContent(rawData);

    return this.pdfService.generateReport('CARGAS DE HABERES', content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
    });
  }
}
