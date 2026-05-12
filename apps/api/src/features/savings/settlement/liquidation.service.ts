// src/savings/savings-liquidation.service.ts
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

    // Validar y transformar con Zod
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
    // 1. Obtener datos básicos del asociado y su cuenta en VES
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

    // 2. Haberes desde vista
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

    const haberesDefaults = {
      total_savings: 0,
      haberes_contribution: 0,
      haberes_voluntary: 0,
      haberes_employer: 0,
      surpluses: 0,
      total_withdrawals: 0,
      total_withdrawal_fees: 0,
    };

    const haberes = { ...haberesDefaults, ...haberesRow };

    // 3. Préstamos pendientes
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

    // 4. Créditos comerciales pendientes
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

    // 5. Monto neto
    const net =
      Number(haberes.total_savings) -
      total_outstanding_loans -
      total_outstanding_credits;

    // Construir objeto crudo
    return {
      ...associateData,
      total_savings_balance: haberes.total_savings,
      haberes_contribution: haberes.haberes_contribution,
      haberes_voluntary: haberes.haberes_voluntary,
      haberes_employer: haberes.haberes_employer,
      surpluses: haberes.surpluses,
      total_withdrawals: haberes.total_withdrawals,
      total_withdrawal_fees: haberes.total_withdrawal_fees,
      total_outstanding_loans,
      total_outstanding_credits,
      net_liquidation_amount: net,
    };
  }
}
