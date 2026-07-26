import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm';
import { JournalBookDto } from '../dto/journal-book.dto';
import { buildJournalBookTableContent } from '../templates/pdf/journal-book.template';

@Injectable()
export class JournalBookService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  async getData(tenantId: string, filters: JournalBookDto) {
    const { accountingCycleId, startDate, endDate, search, page = 1, limit = 50 } = filters;

    const conditions: any[] = [
      eq(schema.accountingEntries.tenantId, tenantId),
    ];

    if (accountingCycleId) {
      conditions.push(
        eq(schema.accountingEntries.accountingCycleId, accountingCycleId),
      );
    }
    if (startDate) {
      conditions.push(gte(schema.accountingEntries.entryDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(schema.accountingEntries.entryDate, endDate));
    }
    if (search) {
      conditions.push(
        or(
          ilike(schema.accountingEntries.description, `%${search}%`),
          sql`CAST(${schema.accountingEntries.voucherNo} AS TEXT) ILIKE ${`%${search}%`}`,
        ),
      );
    }

    const whereClause = and(...conditions);
    const offset = (page - 1) * limit;

    const [countResult] = await this.drizzle
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(schema.accountingEntries)
      .where(whereClause);

    const totalCount = countResult?.count ?? 0;

    const entries = await this.drizzle
      .select({
        entryId: schema.accountingEntries.id,
        entryDate: schema.accountingEntries.entryDate,
        description: schema.accountingEntries.description,
        originType: schema.accountingEntries.originType,
        originReferenceId: schema.accountingEntries.originReferenceId,
        status: schema.accountingEntries.status,
        voucherNo: schema.accountingEntries.voucherNo,
      })
      .from(schema.accountingEntries)
      .where(whereClause)
      .orderBy(asc(schema.accountingEntries.entryDate), asc(schema.accountingEntries.voucherNo))
      .limit(limit)
      .offset(offset);

    const entryIds = entries.map((e) => e.entryId);

    let details: any[] = [];
    if (entryIds.length > 0) {
      details = await this.drizzle
        .select({
          accountingEntryId: schema.accountingEntryDetails.accountingEntryId,
          detailId: schema.accountingEntryDetails.id,
          accountCode: schema.accountPlan.code,
          accountName: schema.accountPlan.name,
          description: schema.accountingEntryDetails.description,
          debit: schema.accountingEntryDetails.debit,
          credit: schema.accountingEntryDetails.credit,
        })
        .from(schema.accountingEntryDetails)
        .innerJoin(
          schema.accountPlan,
          eq(schema.accountingEntryDetails.accountPlanId, schema.accountPlan.id),
        )
        .where(
          inArray(schema.accountingEntryDetails.accountingEntryId, entryIds),
        )
        .orderBy(asc(schema.accountingEntryDetails.id));
    }

    const detailsByEntry = new Map<string, any[]>();
    for (const d of details) {
      const key = d.accountingEntryId;
      if (!detailsByEntry.has(key)) detailsByEntry.set(key, []);
      detailsByEntry.get(key)!.push(d);
    }

    const data = entries.map((entry) => {
      const entryDetails = detailsByEntry.get(entry.entryId) || [];
      const totalDebit = entryDetails
        .reduce((sum, d) => sum + parseFloat(d.debit), 0)
        .toFixed(6);
      const totalCredit = entryDetails
        .reduce((sum, d) => sum + parseFloat(d.credit), 0)
        .toFixed(6);

      return {
        entryId: entry.entryId,
        voucherNo: entry.voucherNo
          ? entry.voucherNo.toString().padStart(8, '0')
          : undefined,
        entryDate: entry.entryDate,
        description: entry.description,
        originType: entry.originType,
        originReferenceId: entry.originReferenceId,
        status: entry.status,
        details: entryDetails.map((d) => ({
          detailId: d.detailId,
          accountCode: d.accountCode,
          accountName: d.accountName,
          description: d.description,
          debit: d.debit,
          credit: d.credit,
        })),
        totalDebit,
        totalCredit,
      };
    });

    return {
      data,
      meta: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPreviousPage: page > 1,
        nextPage: page * limit < totalCount ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      },
    };
  }

  async generatePdf(tenantId: string, filters: JournalBookDto) {
    const { data } = await this.getData(tenantId, {
      ...filters,
      page: 1,
      limit: 10000,
    });

    const content = buildJournalBookTableContent(data);
    return this.pdfService.generateReport('LIBRO DIARIO', content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
    });
  }
}
