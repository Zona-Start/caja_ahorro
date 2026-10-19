import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, ilike, isNotNull, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AccountBalanceDto } from '../dto/account-balance.dto';
import { buildAccountBalanceTableContent } from '../templates/pdf/account-balance.template';

@Injectable()
export class AccountBalanceService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  private computeBalance(
    nature: string,
    debit: number,
    credit: number,
  ): number {
    return nature === 'DEBIT' ? debit - credit : credit - debit;
  }

  async getData(tenantId: string, filters: AccountBalanceDto) {
    const {
      accountingCycleId,
      accountPlanId,
      search = '',
      page = 1,
      limit = 50,
    } = filters;

    const [account] = await this.drizzle
      .select({
        id: schema.accountPlan.id,
        code: schema.accountPlan.code,
        name: schema.accountPlan.name,
        accountType: schema.accountPlan.accountType,
        nature: schema.accountPlan.nature,
        allowsMovements: schema.accountPlan.allowsMovements,
      })
      .from(schema.accountPlan)
      .where(
        and(
          eq(schema.accountPlan.id, accountPlanId),
          eq(schema.accountPlan.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!account) {
      throw new NotFoundException('Cuenta contable no encontrada.');
    }

    const baseConditions: SQL[] = [
      eq(schema.accountingEntries.tenantId, tenantId),
      eq(schema.accountingEntries.status, 'POSTED'),
      eq(schema.accountingEntryDetails.accountPlanId, accountPlanId),
    ];

    if (accountingCycleId) {
      baseConditions.push(
        eq(schema.accountingEntries.accountingCycleId, accountingCycleId),
      );
    }

    const [accountTotalsRow] = await this.drizzle
      .select({
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
      .where(and(...baseConditions));

    const associateConditions: SQL[] = [
      ...baseConditions,
      isNotNull(schema.accountingEntryDetails.associateId),
    ];

    if (search) {
      associateConditions.push(
        or(
          ilike(schema.associates.cedula, `%${search}%`),
          ilike(schema.associates.fullname, `%${search}%`),
        )!,
      );
    }

    const associateRows = await this.drizzle
      .select({
        associateId: schema.accountingEntryDetails.associateId,
        cedula: schema.associates.cedula,
        fullname: schema.associates.fullname,
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
      .where(and(...associateConditions))
      .groupBy(
        schema.accountingEntryDetails.associateId,
        schema.associates.cedula,
        schema.associates.fullname,
      )
      .orderBy(asc(schema.associates.cedula));

    const associates = associateRows.map((row) => {
      const debit = parseFloat(row.totalDebit);
      const credit = parseFloat(row.totalCredit);
      return {
        associateId: row.associateId!,
        cedula: row.cedula,
        fullname: row.fullname,
        totalDebit: row.totalDebit,
        totalCredit: row.totalCredit,
        balance: this.computeBalance(account.nature, debit, credit).toFixed(2),
      };
    });

    const accountDebit = parseFloat(accountTotalsRow?.totalDebit ?? '0');
    const accountCredit = parseFloat(accountTotalsRow?.totalCredit ?? '0');
    const accountBalance = this.computeBalance(
      account.nature,
      accountDebit,
      accountCredit,
    );

    const totalCount = associates.length;
    const offset = (page - 1) * limit;
    const paginated = associates.slice(offset, offset + limit);

    const associatesTotal = associates.reduce(
      (acc, row) => {
        acc.debit += parseFloat(row.totalDebit);
        acc.credit += parseFloat(row.totalCredit);
        acc.balance += parseFloat(row.balance);
        return acc;
      },
      { debit: 0, credit: 0, balance: 0 },
    );

    return {
      account: {
        accountPlanId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.accountType,
        accountNature: account.nature,
        allowsMovements: account.allowsMovements,
        hasAssociateAuxiliary: totalCount > 0,
        totalDebit: accountTotalsRow?.totalDebit ?? '0',
        totalCredit: accountTotalsRow?.totalCredit ?? '0',
        balance: accountBalance.toFixed(2),
      },
      associates: paginated,
      associatesTotal: {
        totalDebit: associatesTotal.debit.toFixed(2),
        totalCredit: associatesTotal.credit.toFixed(2),
        balance: associatesTotal.balance.toFixed(2),
      },
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

  async generatePdf(tenantId: string, filters: AccountBalanceDto) {
    const data = await this.getData(tenantId, {
      ...filters,
      page: 1,
      limit: 100000,
    });

    const content = buildAccountBalanceTableContent(data);
    return this.pdfService.generateReport(
      `BALANCE POR CUENTA - ${data.account.accountCode} ${data.account.accountName}`,
      content,
      { orientation: 'landscape', pageSize: 'LETTER' },
    );
  }
}
