import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  associateAccounts,
  associateHaberesBalance,
  associates,
  creditOutstandingBalance,
  loanOutstandingBalance,
} from '@/database/schema';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
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
  ): Promise<LiquidationResponseDto> {
    const rawResult = await this.fetchRawLiquidationData(identificationNumber);
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

  private async fetchRawLiquidationData(cedula: string): Promise<any | null> {
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
          eq(associateAccounts.status, 'ACTIVE'),
        ),
      )
      .where(
        and(eq(associates.cedula, cedula), eq(associates.status, 'ACTIVE')),
      )
      .limit(1);

    if (!associateData) return null;

    const { associate_account_id, associate_id } = associateData;

    const [haberesRow] = await this.db
      .select({
        total_savings: associateHaberesBalance.haberesBalance,
        haberes_contribution: associateHaberesBalance.haberesContribution,
        haberes_voluntary: associateHaberesBalance.haberesVoluntary,
        haberes_employer: associateHaberesBalance.haberesEmployer,
        surpluses: associateHaberesBalance.surpluses,
        total_withdrawals: associateHaberesBalance.totalWithdrawals,
        total_withdrawal_fees: associateHaberesBalance.totalWithdrawalFees,
      })
      .from(associateHaberesBalance)
      .where(
        eq(associateHaberesBalance.associateAccountId, associate_account_id),
      );

    const loans = await this.db
      .select({
        outstanding: loanOutstandingBalance.outstandingTotalBalance,
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
        outstanding: creditOutstandingBalance.outstandingTotalBalance,
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

    const totalSavings = haberesRow
      ? Number(haberesRow.total_savings)
      : 0;
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

    const net = totalSavings - total_outstanding_loans - total_outstanding_credits;

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
    };
  }
}
