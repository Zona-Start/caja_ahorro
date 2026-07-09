import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  associateAccounts,
  loanAmortizationSchedule,
  loanPayments,
  loanPaymentsDetails,
  loans,
} from '@/database/schema';
import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { AssociateAccountsMovementsService } from '../../../parnerts/associate-accounts-movements/associate-accounts-movements.service';
import {
  AssociateMovementTypeEnum,
  CurrencyCodeEnum,
  loanPaymetTypeEnum,
  paymentMethodEnum,
} from '@/types/enum';
import { and, eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  EPSILON_COMPARISON,
  InstallmentResult,
  LoanInfo,
  PaymentInsertResult,
} from './loan-payment.types';

@Injectable()
export class LoanPaymentProcessor {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
  ) { }

  async generateReference(
    tenantId: string,
  ): Promise<string> {
    return this.generateCodeService.generateNextReference(
      'PRE-PAG',
      tenantId,
      'portfolio',
      'loan-payments',
    );
  }

  async insertPayment(
    data: {
      tenantId: string;
      loanId: string;
      paymentDate: Date;
      paymentType: string;
      amount: number;
      balancePending: number;
      bankId: string | undefined;
      paymentMethod: string;
      transactionReference?: string;
      comment?: string;
      userId: string;
      customReference: string;
    },
    tx: NodePgDatabase<typeof schema>,
  ): Promise<PaymentInsertResult> {
    const [insertedPayment] = await tx
      .insert(loanPayments)
      .values({
        tenantId: data.tenantId,
        loanId: data.loanId,
        paymentDate: data.paymentDate,
        paymentType: data.paymentType as loanPaymetTypeEnum,
        amount: String(data.amount),
        balancePending: String(data.balancePending.toFixed(6)),
        bankId: data.bankId ?? undefined,
        paymentMethod: data.paymentMethod as paymentMethodEnum,
        transactionReference: data.transactionReference,
        comment: data.comment,
        createdById: data.userId,
        customReference: data.customReference,
        status: 'DONE',
      })
      .returning({
        id: loanPayments.id,
        customReference: loanPayments.customReference,
      });

    return {
      id: insertedPayment.id,
      customReference: insertedPayment.customReference!,
    };
  }

  async updateInstallmentPaid(
    installmentId: string,
    userId: string,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<void> {
    await tx
      .update(loanAmortizationSchedule)
      .set({
        paymentStatus: 'PAID',
        updatedById: userId,
        paidAmount: sql`total_installment_amount`,
      })
      .where(eq(loanAmortizationSchedule.id, installmentId));
  }

  async updateInstallmentPartial(
    installmentId: string,
    paidAmount: number,
    userId: string,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<void> {
    await tx
      .update(loanAmortizationSchedule)
      .set({
        paymentStatus: 'PARTIAL',
        paidAmount: String(paidAmount),
        updatedById: userId,
      })
      .where(eq(loanAmortizationSchedule.id, installmentId));
  }

  async insertPaymentDetail(
    loanPaymentId: string,
    installmentId: string,
    amount: number,
    userId: string,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<void> {
    await tx.insert(loanPaymentsDetails).values({
      loanPaymentId,
      installmentId,
      amount: String(amount),
      createdById: userId,
    });
  }

  async updateLoanStatus(
    loanId: string,
    tenantId: string,
    status: 'PAID' | 'IN_PAYMENT',
    balanceInFavor: number,
    userId: string,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<void> {
    await tx
      .update(loans)
      .set({
        status,
        balanceInFavor: String(balanceInFavor.toFixed(6)),
        updatedById: userId,
      })
      .where(and(eq(loans.id, loanId), eq(loans.tenantId, tenantId)));
  }

  async cancelPayment(
    paymentId: string,
    tenantId: string,
    userId: string,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<void> {
    await tx
      .update(loanPayments)
      .set({
        status: 'CANCELED',
        updatedById: userId,
      })
      .where(
        and(
          eq(loanPayments.id, paymentId),
          eq(loanPayments.tenantId, tenantId),
        ),
      );
  }

  async cancelPaymentDetail(
    detailId: string,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<void> {
    await tx
      .update(loanPaymentsDetails)
      .set({ status: 'CANCELED' })
      .where(eq(loanPaymentsDetails.id, detailId));
  }

  async revertInstallment(
    installmentId: string,
    amountToRevert: number,
    userId: string,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<{ principalReverted: number; interestReverted: number }> {
    const currentInstallment =
      await tx.query.loanAmortizationSchedule.findFirst({
        where: eq(loanAmortizationSchedule.id, installmentId),
      });

    if (!currentInstallment) {
      return { principalReverted: 0, interestReverted: 0 };
    }

    const installmentPaid = Number(currentInstallment.paidAmount);
    const installmentInterest = Number(currentInstallment.interestAmount);

    const principalInInstallmentBefore = Math.max(
      0,
      installmentPaid - installmentInterest,
    );

    const principalReverted = Math.min(
      amountToRevert,
      principalInInstallmentBefore,
    );
    const interestReverted = amountToRevert - principalReverted;

    const newPaidAmount = Math.max(
      0,
      Number(currentInstallment.paidAmount) - amountToRevert,
    );

    const newStatus: 'PENDING' | 'PARTIAL' = newPaidAmount > 0 ? 'PARTIAL' : 'PENDING';

    await tx
      .update(loanAmortizationSchedule)
      .set({
        paidAmount: String(newPaidAmount),
        paymentStatus: newStatus,
        updatedById: userId,
      })
      .where(eq(loanAmortizationSchedule.id, installmentId));

    return { principalReverted, interestReverted };
  }

  async getAssociateAccount(
    associateId: string,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<{ id: string } | undefined> {
    const [acc] = await tx
      .select({ id: associateAccounts.id })
      .from(associateAccounts)
      .where(eq(associateAccounts.associateId, associateId));
    return acc;
  }

  async createAssociateMovement(
    userId: string,
    payload: {
      associateAccountId: string | undefined;
      movementType: AssociateMovementTypeEnum;
      amount: number;
      currencyCode: CurrencyCodeEnum;
      transactionDate?: Date;
      description: string;
      referenceId: string;
      referenceType: string;
      referenceNumber?: string;
      area?: string;
    },
    tenantId: string,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<void> {
    if (!payload.associateAccountId) return;
    await this.associateAccountsMovementsService.create(
      userId,
      payload as any,
      tenantId,
      tx,
    );
  }

  async applyPaymentFromBankReconciliation(
    paymentId: string,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<void> {
    await tx
      .update(loanPayments)
      .set({ status: 'DONE' })
      .where(eq(loanPayments.id, paymentId));
  }

  determinNewLoanStatus(newBalancePending: number): 'PAID' | 'IN_PAYMENT' {
    return newBalancePending <= 0 ? 'PAID' : 'IN_PAYMENT';
  }

  getAppliedAmount(amount: number, remainingAmount: number): number {
    return amount - remainingAmount;
  }

  getNewBalancePending(
    currentBalance: number,
    appliedAmount: number,
  ): number {
    const balance = Math.max(0, currentBalance - appliedAmount);
    return balance < EPSILON_COMPARISON ? 0 : balance;
  }
}
