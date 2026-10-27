import { computePendingBalance } from '@/common/utils/pending-balance';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  associates,
  loanAmortizationSchedule,
  loanPayments,
  loans,
  loanTypes,
} from '@/database/schema';
import { LoanStatusEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  EPSILON_COMPARISON,
  InstallmentResult,
  LoanInfo,
  PaidInstallmentDetail,
  PartialInstallment,
  ROUNDING_ACCEPTANCE_TOLERANCE,
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
        exchangeRate: loans.exchangeRate,
        associateFullname: associates.fullname,
        loanTypeName: loanTypes.name,
      })
      .from(loans)
      .leftJoin(associates, eq(associates.id, loans.associateId))
      .leftJoin(loanTypes, eq(loanTypes.id, loans.loanTypeId))
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
        principalAmount: loanAmortizationSchedule.principalAmount,
        interestAmount: loanAmortizationSchedule.interestAmount,
        paidAmount: loanAmortizationSchedule.paidAmount,
        paymentStatus: loanAmortizationSchedule.paymentStatus,
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

    return computePendingBalance(loanAmortization);
  }

  /**
   * Saldo pendiente de partida para un nuevo pago.
   *
   * Es el `balance_pending` del último pago registrado (saldo corriente, que ya
   * está cuadrado con el saldo contable, incluso en préstamos migrados). Si el
   * préstamo no tiene pagos, se calcula desde la tabla de amortización (caso de
   * préstamos nuevos).
   */
  async getPendingBalanceBase(
    loanId: string,
    db?: NodePgDatabase<typeof schema>,
  ): Promise<number> {
    const conn = db || this.db;
    const [lastPayment] = await conn
      .select({ balancePending: loanPayments.balancePending })
      .from(loanPayments)
      .where(
        and(eq(loanPayments.loanId, loanId), eq(loanPayments.status, 'DONE')),
      )
      .orderBy(desc(loanPayments.paymentDate), desc(loanPayments.createdAt))
      .limit(1);

    if (lastPayment?.balancePending != null) {
      return Number(lastPayment.balancePending);
    }

    return this.calculateBalancePending(loanId, conn);
  }

  async calculateCoveredInstallments(
    loanId: string,
    amount: number,
    db?: NodePgDatabase<typeof schema>,
    pendingBalanceBase?: number,
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

    const pendingBase =
      pendingBalanceBase ?? (await this.getPendingBalanceBase(loanId, conn));

    // Cierre: si el pago cubre el capital pendiente, se cierran todas las
    // cuotas restantes y se condona el interés no cobrado (no genera
    // movimientos ni asientos de interés adicionales).
    if (amount + EPSILON_COMPARISON >= pendingBase) {
      let totalInterestDue = 0;
      const closingDetails: PaidInstallmentDetail[] = [];

      for (const installment of pendingInstallments) {
        const installmentTotal = Number(installment.totalInstallmentAmount);
        const installmentPaid = Number(installment.paidAmount || 0);
        const dueAmountExact = installmentTotal - installmentPaid;
        if (dueAmountExact <= EPSILON_COMPARISON) continue;

        const princInst = Number(installment.principalAmount);
        const intInst = Number(installment.interestAmount);
        const interestPaidBefore = Math.min(installmentPaid, intInst);
        const interestStillDue = Math.max(0, intInst - interestPaidBefore);
        const principalPaidBefore = Math.max(0, installmentPaid - intInst);
        const principalStillDue = Math.max(0, princInst - principalPaidBefore);

        totalInterestDue += interestStillDue;

        closingDetails.push({
          id: installment.id,
          amount: dueAmountExact,
          principal: principalStillDue,
          interest: interestStillDue,
        });
      }

      if (closingDetails.length === 0) {
        return {
          paidInstallmentDetails: [],
          partialInstallment: undefined,
          remainingAmount: parseFloat(Math.max(0, amount).toFixed(6)),
        };
      }

      // El capital registrado cierra exactamente contra el saldo base.
      const principalSum = closingDetails.reduce(
        (sum, detail) => sum + detail.principal,
        0,
      );
      const principalDelta = parseFloat(
        (pendingBase - principalSum).toFixed(6),
      );
      const lastDetail = closingDetails[closingDetails.length - 1];
      lastDetail.principal = parseFloat(
        Math.max(0, lastDetail.principal + principalDelta).toFixed(6),
      );

      // Solo se registra como interés el excedente sobre el capital; el
      // interés no cobrado se condona.
      const interestToRecord = Math.min(
        Math.max(0, amount - pendingBase),
        totalInterestDue,
      );
      let interestToCondone = parseFloat(
        (totalInterestDue - interestToRecord).toFixed(6),
      );
      for (
        let i = closingDetails.length - 1;
        i >= 0 && interestToCondone > 0;
        i--
      ) {
        const reduce = Math.min(closingDetails[i].interest, interestToCondone);
        closingDetails[i].interest = parseFloat(
          (closingDetails[i].interest - reduce).toFixed(6),
        );
        interestToCondone = parseFloat((interestToCondone - reduce).toFixed(6));
      }

      for (const detail of closingDetails) {
        detail.amount = parseFloat(
          (detail.principal + detail.interest).toFixed(6),
        );
      }

      return {
        paidInstallmentDetails: closingDetails,
        partialInstallment: undefined,
        // Exceso = lo que supera el CAPITAL pendiente (el interés se condona).
        remainingAmount: parseFloat(
          Math.max(0, amount - pendingBase).toFixed(6),
        ),
      };
    }

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
        amountBase: loanPayments.amountBase,
        exchangeRate: loanPayments.exchangeRate,
        currencyCode: loanPayments.currencyCode,
        customReference: loanPayments.customReference,
        loanId: loanPayments.loanId,
        statusPayment: loanPayments.status,
        associateId: loans.associateId,
        associateFullname: associates.fullname,
        loanTypeName: loanTypes.name,
      })
      .from(loanPayments)
      .leftJoin(
        loans,
        and(eq(loans.id, loanPayments.loanId), eq(loans.tenantId, tenantId)),
      )
      .leftJoin(loanTypes, eq(loanTypes.id, loans.loanTypeId))
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
