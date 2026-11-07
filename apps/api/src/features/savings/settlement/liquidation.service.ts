import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  associateAccounts,
  associateHaberesBalance,
  associates,
  creditOutstandingBalance,
  credits,
  creditsTypes,
  loanOutstandingBalance,
  loans,
  loanTypes,
} from '@/database/schema';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ZodError } from 'zod';
import {
  LiquidationResponseDto,
  LiquidationResponseSchema,
} from './dto/liquidation-response.dto';

@Injectable()
export class SavingsLiquidationService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
  ) {}

  async calculateAssociateLiquidation(
    identificationNumber: string,
    tenantId?: string,
  ): Promise<LiquidationResponseDto> {
    const rawResult = await this.fetchRawLiquidationData(
      identificationNumber,
      tenantId,
    );
    if (!rawResult) {
      throw new NotFoundException(
        `No se encontró asociado con cédula ${identificationNumber} activo y cuenta en VES`,
      );
    }

    try {
      return LiquidationResponseSchema.parse(rawResult);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new InternalServerErrorException(
          'Error de integridad de datos en la liquidación',
        );
      }
      throw error;
    }
  }

  /**
   * Desglose del capital pendiente de préstamos y créditos por tipo.
   * Se usa para construir los roles contables por tipo en Operaciones Especiales.
   */
  async getAssociateDebtBreakdown(
    associateId: string,
    tenantId: string,
    currencyCode = 'VES',
  ): Promise<{
    loans: Array<{ typeName: string; amount: number }>;
    credits: Array<{ typeName: string; amount: number }>;
  }> {
    const loanRows = await this.db
      .select({
        typeName: loanTypes.name,
        amount: loanOutstandingBalance.capitalPendiente,
      })
      .from(loanOutstandingBalance)
      .leftJoin(loans, eq(loans.id, loanOutstandingBalance.loanId))
      .leftJoin(loanTypes, eq(loanTypes.id, loans.loanTypeId))
      .where(
        and(
          eq(loanOutstandingBalance.associateId, associateId),
          eq(loanOutstandingBalance.tenantId, tenantId),
          eq(loanOutstandingBalance.currencyCode, currencyCode),
        ),
      );

    const creditRows = await this.db
      .select({
        typeName: creditsTypes.name,
        amount: creditOutstandingBalance.capitalPendiente,
      })
      .from(creditOutstandingBalance)
      .leftJoin(
        credits,
        eq(credits.id, creditOutstandingBalance.creditId),
      )
      .leftJoin(
        creditsTypes,
        eq(creditsTypes.id, credits.creditTypeId),
      )
      .where(
        and(
          eq(creditOutstandingBalance.associateId, associateId),
          eq(creditOutstandingBalance.tenantId, tenantId),
          eq(creditOutstandingBalance.currencyCode, currencyCode),
        ),
      );

    const groupByType = (
      rows: Array<{ typeName: string | null; amount: string | null }>,
      fallback: string,
    ) => {
      const grouped = new Map<string, number>();
      for (const row of rows) {
        const typeName = row.typeName?.trim() || fallback;
        const amount = Number(row.amount ?? 0);
        if (!amount) continue;
        grouped.set(typeName, (grouped.get(typeName) ?? 0) + amount);
      }
      return Array.from(grouped.entries()).map(([typeName, amount]) => ({
        typeName,
        amount,
      }));
    };

    return {
      loans: groupByType(loanRows, 'PRESTAMO'),
      credits: groupByType(creditRows, 'CREDITO'),
    };
  }

  private async fetchRawLiquidationData(
    cedula: string,
    tenantId?: string,
  ): Promise<any | null> {
    const associateConditions = [
      eq(associates.cedula, cedula),
      inArray(associates.status, ['ACTIVE', 'PENDING']),
    ];
    if (tenantId) {
      associateConditions.push(eq(associates.tenantId, tenantId));
    }

    const [associateData] = await this.db
      .select({
        associate_id: associates.id,
        fullname: associates.fullname,
        cedula: associates.cedula,
        admission_date: associates.dateAdmission,
        phone: associates.phone,
        email: associates.email,
        is_payroll_credit: associates.isPayrollCredit,
        associate_account_id: associateAccounts.id,
        account_number: associateAccounts.accountNumber,
      })
      .from(associates)
      .innerJoin(
        associateAccounts,
        and(
          eq(associates.id, associateAccounts.associateId),
          eq(associateAccounts.currencyCode, 'VES'),
        ),
      )
      .where(and(...associateConditions))
      .limit(1);

    if (!associateData) return null;

    const { associate_account_id, associate_id } = associateData;

    const [haberesRow] = await this.db
      .select({
        total_savings: associateHaberesBalance.haberesBalance,
        haberes_contribution: associateHaberesBalance.haberesContribution,
        haberes_voluntary: associateHaberesBalance.haberesVoluntary,
        haberes_employer: associateHaberesBalance.haberesEmployer,
        surpluses: associateHaberesBalance.haberesSurplusContribution,
        total_withdrawals: associateHaberesBalance.totalWithdrawals,
        total_withdrawal_fees: associateHaberesBalance.totalWithdrawalFees,
        total_overpayment: associateHaberesBalance.totalOverpayment,
      })
      .from(associateHaberesBalance)
      .where(
        eq(associateHaberesBalance.associateAccountId, associate_account_id),
      );

    const loans = await this.db
      .select({
        outstanding: loanOutstandingBalance.capitalPendiente,
      })
      .from(loanOutstandingBalance)
      .where(
        and(
          eq(loanOutstandingBalance.associateId, associate_id),
          eq(loanOutstandingBalance.currencyCode, 'VES'),
        ),
      );

    const total_outstanding_loans = loans.reduce(
      (sum, row) => sum + Number(row.outstanding),
      0,
    );

    const credits = await this.db
      .select({
        outstanding: creditOutstandingBalance.capitalPendiente,
      })
      .from(creditOutstandingBalance)
      .where(
        and(
          eq(creditOutstandingBalance.associateId, associate_id),
          eq(creditOutstandingBalance.currencyCode, 'VES'),
        ),
      );

    const total_outstanding_credits = credits.reduce(
      (sum, row) => sum + Number(row.outstanding),
      0,
    );

    const totalSavings = haberesRow ? Number(haberesRow.total_savings) : 0;
    const haberesContribution = haberesRow
      ? Number(haberesRow.haberes_contribution)
      : 0;
    const haberesVoluntary = haberesRow
      ? Number(haberesRow.haberes_voluntary)
      : 0;
    const haberesEmployer = haberesRow
      ? Number(haberesRow.haberes_employer)
      : 0;
    const surpluses = haberesRow ? Number(haberesRow.surpluses) : 0;
    const totalWithdrawals = haberesRow
      ? Number(haberesRow.total_withdrawals)
      : 0;
    const totalWithdrawalFees = haberesRow
      ? Number(haberesRow.total_withdrawal_fees)
      : 0;
    const totalOverpayment = haberesRow
      ? Number(haberesRow.total_overpayment)
      : 0;

    const net =
      totalSavings - total_outstanding_loans - total_outstanding_credits;

    return {
      ...associateData,
      currency_code: 'VES',
      total_savings_balance: totalSavings,
      haberes_contribution: haberesContribution,
      haberes_voluntary: haberesVoluntary,
      haberes_employer: haberesEmployer,
      surpluses: surpluses,
      total_withdrawals: totalWithdrawals,
      total_withdrawal_fees: totalWithdrawalFees,
      total_outstanding_loans,
      total_outstanding_credits,
      net_liquidation_amount: net,
      total_overpayment: totalOverpayment,
    };
  }
}
