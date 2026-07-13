import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { WithdrawalsReportDto } from '../dto/withdrawals-report.dto';
import { buildWithdrawalsTableContent } from '../templates/pdf/withdrawals.template';

@Injectable()
export class WithdrawalsReportService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  async generatePdf(tenantId: string, filters: WithdrawalsReportDto) {
    const conditions: any[] = [
      eq(schema.withdrawalsAssociates.tenantId, tenantId),
    ];

    if (filters.withdrawalTypeId) {
      conditions.push(
        eq(
          schema.withdrawalsAssociates.withdrawalTypeId,
          filters.withdrawalTypeId,
        ),
      );
    }
    if (filters.reference) {
      conditions.push(
        eq(schema.withdrawalsAssociates.referenceCode, filters.reference),
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
          eq(schema.associateAccounts.associateId, associate.id),
        );
      }
    }
    if (filters.dateFrom) {
      const startDate = new Date(filters.dateFrom + 'T00:00:00');
      conditions.push(
        gte(
          schema.withdrawalsAssociates.withdrawalDate,
          startDate,
        ),
      );
    }
    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo + 'T23:59:59');
      conditions.push(
        lte(
          schema.withdrawalsAssociates.withdrawalDate,
          endDate,
        ),
      );
    }

    const rawData = await this.drizzle
      .select({
        withdrawalDate: schema.withdrawalsAssociates.withdrawalDate,
        associateFullname: schema.associates.fullname,
        associateCedula: schema.associates.cedula,
        withdrawalType: schema.withdrawalTypes.description,
        requestedAmount: schema.withdrawalsAssociates.requestedAmount,
        administrativeFee: schema.withdrawalsAssociates.administrativeFee,
        disbursedAmount: schema.withdrawalsAssociates.disbursedAmount,
        referenceCode: schema.withdrawalsAssociates.referenceCode,
        paymentMethod: schema.withdrawalsAssociates.paymentMethod,
        status: schema.withdrawalsAssociates.status,
      })
      .from(schema.withdrawalsAssociates)
      .leftJoin(
        schema.associateAccounts,
        eq(
          schema.withdrawalsAssociates.associateAccountId,
          schema.associateAccounts.id,
        ),
      )
      .leftJoin(
        schema.associates,
        eq(schema.associateAccounts.associateId, schema.associates.id),
      )
      .leftJoin(
        schema.withdrawalTypes,
        eq(
          schema.withdrawalsAssociates.withdrawalTypeId,
          schema.withdrawalTypes.id,
        ),
      )
      .where(and(...conditions));

    const content = buildWithdrawalsTableContent(rawData);

    return this.pdfService.generateReport('RETIROS DE HABERES', content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
    });
  }
}
