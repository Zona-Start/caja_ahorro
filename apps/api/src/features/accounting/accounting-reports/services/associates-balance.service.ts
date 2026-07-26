import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, asc, eq, sql } from 'drizzle-orm';
import { AssociatesBalanceDto } from '../dto/associates-balance.dto';
import { buildAssociatesBalanceTableContent } from '../templates/pdf/associates-balance.template';

@Injectable()
export class AssociatesBalanceService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  async getData(tenantId: string, filters: AssociatesBalanceDto) {
    const {
      accountingCycleId,
      associateId,
      accountPlanId,
      page = 1,
      limit = 50,
    } = filters;

    const entryConditions: any[] = [
      eq(schema.accountingEntries.tenantId, tenantId),
      eq(schema.accountingEntries.status, 'POSTED'),
      sql`${schema.accountingEntryDetails.associateId} IS NOT NULL`,
    ];

    if (accountingCycleId) {
      entryConditions.push(
        eq(schema.accountingEntries.accountingCycleId, accountingCycleId),
      );
    }

    const movements = await this.drizzle
      .select({
        associateId: schema.accountingEntryDetails.associateId,
        associateCedula: schema.associates.cedula,
        associateName: schema.associates.fullname,
        accountPlanId: schema.accountingEntryDetails.accountPlanId,
        accountCode: schema.accountPlan.code,
        accountName: schema.accountPlan.name,
        accountNature: schema.accountPlan.nature,
        totalDebit: sql<string>`COALESCE(SUM(${schema.accountingEntryDetails.debit}), 0)::text`,
        totalCredit: sql<string>`COALESCE(SUM(${schema.accountingEntryDetails.credit}), 0)::text`,
      })
      .from(schema.accountingEntryDetails)
      .innerJoin(
        schema.accountingEntries,
        eq(
          schema.accountingEntryDetails.accountingEntryId,
          schema.accountingEntries.id,
        ),
      )
      .innerJoin(
        schema.associates,
        eq(schema.accountingEntryDetails.associateId, schema.associates.id),
      )
      .innerJoin(
        schema.accountPlan,
        eq(schema.accountingEntryDetails.accountPlanId, schema.accountPlan.id),
      )
      .where(and(...entryConditions))
      .groupBy(
        schema.accountingEntryDetails.associateId,
        schema.associates.cedula,
        schema.associates.fullname,
        schema.accountingEntryDetails.accountPlanId,
        schema.accountPlan.code,
        schema.accountPlan.name,
        schema.accountPlan.nature,
      )
      .orderBy(asc(schema.associates.cedula), asc(schema.accountPlan.code));

    // Group by associate
    const associateMap = new Map<string, any>();

    for (const m of movements) {
      if (associateId && m.associateId !== associateId) continue;
      if (accountPlanId && m.accountPlanId !== accountPlanId) continue;

      const key = m.associateId!;
      if (!associateMap.has(key)) {
        associateMap.set(key, {
          associateId: m.associateId,
          cedula: m.associateCedula,
          fullname: m.associateName,
          accounts: [],
          totalBalance: '0.00',
        });
      }

      const debit = parseFloat(m.totalDebit);
      const credit = parseFloat(m.totalCredit);
      const nature = m.accountNature;

      let accountBalance: number;
      if (nature === 'DEBIT') {
        accountBalance = debit - credit;
      } else {
        accountBalance = credit - debit;
      }

      associateMap.get(key)!.accounts.push({
        accountPlanId: m.accountPlanId,
        accountCode: m.accountCode,
        accountName: m.accountName,
        accountNature: nature,
        totalDebit: m.totalDebit,
        totalCredit: m.totalCredit,
        balance: accountBalance.toFixed(6),
      });
    }

    let associates = [...associateMap.values()];

    for (const assoc of associates) {
      const totalBal = assoc.accounts.reduce(
        (sum: number, a: any) => sum + parseFloat(a.balance),
        0,
      );
      assoc.totalBalance = Math.abs(totalBal).toFixed(2);
      assoc.accounts.sort(
        (a: any, b: any) =>
          a.accountCode.localeCompare(b.accountCode),
      );
    }

    const totalCount = associates.length;
    const offset = (page - 1) * limit;
    associates = associates.slice(offset, offset + limit);

    return {
      data: associates,
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

  async generatePdf(tenantId: string, filters: AssociatesBalanceDto) {
    const { data } = await this.getData(tenantId, {
      ...filters,
      page: 1,
      limit: 10000,
    });

    const content = buildAssociatesBalanceTableContent(data);
    return this.pdfService.generateReport('BALANCE DE ASOCIADOS', content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
    });
  }
}
