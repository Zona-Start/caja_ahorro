import { Inject, Injectable } from '@nestjs/common';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  associates,
  loanAmortizationSchedule,
  loans,
  loanPayments,
} from '@/database/schema';
import { LoanStatusEnum } from '@/types/enum';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  EPSILON_COMPARISON,
  ROUNDING_ACCEPTANCE_TOLERANCE,
  InstallmentResult,
  LoanInfo,
  PaidInstallmentDetail,
  PartialInstallment,
} from './loan-payment.types';

@Injectable()
export class LoanPaymentValidator {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
  ) {}

  async validateAndLoadLoan(
    tenantId: string,
    loanId: string,
    db?: NodePgDatabase<typeof schema>,
  ): Promise<LoanInfo> {
    const conn = db || this.db;
    const [loan] = await conn
      .select({
        id: loans.id,
        associateId: loans.associateId,
        status: loans.status,
        currencyCode: loans.currencyCode,
        associateFullname: associates.fullname,
      })
      .from(loans)
      .leftJoin(associates, eq(associates.id, loans.associateId))
      .where(and(eq(loans.id, loanId), eq(loans.tenantId, tenantId)));

    if (!loan) {
      throw new NotFoundException('The loan was not found.');
    }
    return loan;
  }

  validateLoanStatus(loan: LoanInfo): void {
    if (
      loan.status !== LoanStatusEnum.DISBURSED &&
      loan.status !== LoanStatusEnum.IN_PAYMENT
    ) {
      throw new BadRequestException(
        'Payments cannot be made on loans with a status other than disbursed or in payment.',
      );
    }
  }

  validatePaymentNotCancelled(payment: { statusPayment: string }): void {
    if (payment.statusPayment === 'CANCELED') {
      throw new BadRequestException('This payment has already been cancelled.');
    }
  }

  validatePaymentHasLoan(payment: { loanId: string | null }): void {
    if (!payment?.loanId) {
      throw new InternalServerErrorException(
        'The payment does not have a valid loanId.',
      );
    }
  }

  async calculateBalancePending(
    loanId: string,
    db?: NodePgDatabase<typeof schema>,
  ): Promise<number> {
    const conn = db || this.db;
    const loanAmortization = await conn
      .select({
        quotaAmount: loanAmortizationSchedule.totalInstallmentAmount,
        paidAmount: loanAmortizationSchedule.paidAmount,
        quotaStatus: loanAmortizationSchedule.paymentStatus,
      })
      .from(loanAmortizationSchedule)
      .where(eq(loanAmortizationSchedule.loanId, loanId))
      .orderBy(
        sql<string>`
          CASE payment_status
            WHEN 'PARTIAL' THEN 1
            WHEN 'PENDING' THEN 2
            WHEN 'PAID' THEN 3
            ELSE 4
          END ASC,
          id ASC`,
      );

    const totalRemainingExact = loanAmortization.reduce((acc, item) => {
      const total = Number(item.quotaAmount);
      const paid = Number(item.paidAmount || 0);
      const remaining = total - paid;
      return acc + (remaining > EPSILON_COMPARISON ? remaining : 0);
    }, 0);

    return parseFloat(totalRemainingExact.toFixed(6));
  }

  async calculateCoveredInstallments(
    loanId: string,
    amount: number,
    db?: NodePgDatabase<typeof schema>,
  ): Promise<InstallmentResult> {
    const conn = db || this.db;
    const pendingInstallments =
      await conn.query.loanAmortizationSchedule.findMany({
        where: and(
          eq(loanAmortizationSchedule.loanId, loanId),
          inArray(loanAmortizationSchedule.paymentStatus, [
            'PENDING',
            'PARTIAL',
          ]),
        ),
        orderBy: loanAmortizationSchedule.installmentNumber,
      });

    const paidInstallmentDetails: PaidInstallmentDetail[] = [];
    let partialInstallment: PartialInstallment | undefined;

    let remainingPaymentAmount = amount;

    for (const installment of pendingInstallments) {
      const installmentTotal = Number(installment.totalInstallmentAmount);
      const installmentPaid = Number(installment.paidAmount || 0);
      const dueAmountExact = installmentTotal - installmentPaid;

      if (dueAmountExact <= EPSILON_COMPARISON) {
        continue;
      }

      const diffBetweenPaymentAndDue = Math.abs(
        remainingPaymentAmount - dueAmountExact,
      );

      if (
        remainingPaymentAmount >= dueAmountExact - EPSILON_COMPARISON ||
        diffBetweenPaymentAndDue <= ROUNDING_ACCEPTANCE_TOLERANCE
      ) {
        const totalInst = Number(installment.totalInstallmentAmount);
        const princInst = Number(installment.principalAmount);
        const intInst = Number(installment.interestAmount);
        const alreadyPaid = Number(installment.paidAmount || 0);

        const interestPaidBefore = Math.min(alreadyPaid, intInst);
        const interestStillDue = Math.max(0, intInst - interestPaidBefore);
        const principalPaidBefore = Math.max(0, alreadyPaid - intInst);
        const principalStillDue = Math.max(0, princInst - principalPaidBefore);

        paidInstallmentDetails.push({
          id: installment.id,
          amount: totalInst,
          principal: principalStillDue,
          interest: interestStillDue,
        });

        remainingPaymentAmount = Math.max(
          0,
          remainingPaymentAmount - dueAmountExact,
        );

        if (
          remainingPaymentAmount > EPSILON_COMPARISON &&
          remainingPaymentAmount <= ROUNDING_ACCEPTANCE_TOLERANCE
        ) {
          remainingPaymentAmount = 0;
          break;
        }
      } else {
        const princInst = Number(installment.principalAmount);
        const intInst = Number(installment.interestAmount);
        const alreadyPaid = Number(installment.paidAmount || 0);

        const interestPaidBefore = Math.min(alreadyPaid, intInst);
        const interestStillDue = Math.max(0, intInst - interestPaidBefore);

        let newInterestPaid = 0;
        let newPrincipalPaid = 0;

        if (remainingPaymentAmount <= interestStillDue) {
          newInterestPaid = remainingPaymentAmount;
          newPrincipalPaid = 0;
        } else {
          newInterestPaid = interestStillDue;
          newPrincipalPaid = remainingPaymentAmount - interestStillDue;
        }

        partialInstallment = {
          id: installment.id,
          paidAmount: parseFloat(
            (alreadyPaid + remainingPaymentAmount).toFixed(6),
          ),
          originalPaidAmount: alreadyPaid,
          principal: newPrincipalPaid,
          interest: newInterestPaid,
        };
        remainingPaymentAmount = 0;
        break;
      }

      if (remainingPaymentAmount <= EPSILON_COMPARISON) {
        remainingPaymentAmount = 0;
        break;
      }
    }

    if (
      remainingPaymentAmount < EPSILON_COMPARISON &&
      remainingPaymentAmount > -EPSILON_COMPARISON
    ) {
      remainingPaymentAmount = 0;
    }

    return {
      paidInstallmentDetails,
      partialInstallment,
      remainingAmount: parseFloat(remainingPaymentAmount.toFixed(6)),
    };
  }

  async findAssociateByCedula(
    cedula: string,
    tenantId: string,
    db?: NodePgDatabase<typeof schema>,
  ) {
    const conn = db || this.db;
    const [associate] = await conn
      .select({
        id: associates.id,
        cedula: associates.cedula,
        fullname: associates.fullname,
        phone: associates.phone,
        email: associates.email,
        status: associates.status,
      })
      .from(associates)
      .where(
        and(eq(associates.cedula, cedula), eq(associates.tenantId, tenantId)),
      );

    if (!associate) {
      throw new NotFoundException(`Associate with cedula ${cedula} not found`);
    }
    return associate;
  }

  async findPaymentWithDetails(
    paymentId: string,
    tenantId: string,
    db?: NodePgDatabase<typeof schema>,
  ) {
    const conn = db || this.db;
    const [payment] = await conn
      .select({
        id: loanPayments.id,
        amount: loanPayments.amount,
        customReference: loanPayments.customReference,
        loanId: loanPayments.loanId,
        statusPayment: loanPayments.status,
        associateId: loans.associateId,
        currencyCode: loans.currencyCode,
        associateFullname: associates.fullname,
      })
      .from(loanPayments)
      .leftJoin(
        loans,
        and(eq(loans.id, loanPayments.loanId), eq(loans.tenantId, tenantId)),
      )
      .leftJoin(associates, eq(associates.id, loans.associateId))
      .where(
        and(
          eq(loanPayments.id, paymentId),
          eq(loanPayments.tenantId, tenantId),
        ),
      );

    return payment || null;
  }

  async countPaymentsForLoan(
    loanId: string,
    tenantId: string,
    db?: NodePgDatabase<typeof schema>,
  ): Promise<number> {
    const conn = db || this.db;
    const [result] = await conn
      .select({ count: sql<number>`count(*)` })
      .from(loanPayments)
      .where(
        and(
          eq(loanPayments.tenantId, tenantId),
          eq(loanPayments.loanId, loanId),
          eq(loanPayments.status, 'DONE'),
        ),
      );
    return Number(result.count);
  }
}
