import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { loans } from '@/database/schema';
import { OutboxWriterService } from '@/shared/outbox';
import {
  AssociateMovementTypeEnum,
  BankTransactionCategory,
  CurrencyCodeEnum,
} from '@/types/enum';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { v4 as uuidv4 } from 'uuid';
import { LoanPaymentAccounting } from '../domain/loan-payment.accounting';
import { LoanPaymentAudit } from '../domain/loan-payment.audit';
import { LoanPaymentBank } from '../domain/loan-payment.bank';
import { LoanPaymentProcessor } from '../domain/loan-payment.processor';
import { EPSILON_COMPARISON } from '../domain/loan-payment.types';
import { LoanPaymentValidator } from '../domain/loan-payment.validator';
import { CreateLoanPaidDto } from '../dto/loan-paid.schema';
import { LOAN_PAYMENT_EVENTS } from '../events/loan-payment.events';

@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly outbox: OutboxWriterService,
    private readonly validator: LoanPaymentValidator,
    private readonly processor: LoanPaymentProcessor,
    private readonly accounting: LoanPaymentAccounting,
    private readonly bank: LoanPaymentBank,
    private readonly audit: LoanPaymentAudit,
  ) { }

  async execute(
    tenantId: string,
    userId: string,
    dto: CreateLoanPaidDto,
    tx?: NodePgDatabase<typeof schema>,
    liquidationActive?: boolean,
  ) {
    const {
      amount,
      bankId,
      loanId,
      paymentDate,
      paymentMethod,
      paymentType,
      comment,
      transactionReference,
    } = dto;

    const db = tx || this.db;
    const loan = await this.validator.validateAndLoadLoan(tenantId, loanId, db);
    this.validator.validateLoanStatus(loan);

    const result = await this.db.transaction(async (tx) => {
      const [lockedLoan] = await tx
        .select()
        .from(loans)
        .where(and(eq(loans.id, loanId), eq(loans.tenantId, tenantId)))
        .for('update');

      if (!lockedLoan) {
        throw new NotFoundException('Loan not found');
      }

      const pendingBalanceBase = await this.validator.getPendingBalanceBase(
        loanId,
        tx,
      );

      const installmentResult =
        await this.validator.calculateCoveredInstallments(
          loanId,
          amount,
          tx,
          pendingBalanceBase,
        );



      const appliedAmountExact = this.processor.getAppliedAmount(
        amount,
        installmentResult.remainingAmount,
      );

      let totalPrincipalPaid = 0;
      let totalInterestPaid = 0;

      for (const installment of installmentResult.paidInstallmentDetails) {
        totalPrincipalPaid += installment.principal;
        totalInterestPaid += installment.interest;
      }

      if (installmentResult.partialInstallment) {
        totalPrincipalPaid += installmentResult.partialInstallment.principal;
        totalInterestPaid += installmentResult.partialInstallment.interest;
      }

      const newBalancePending = this.processor.getNewBalancePending(
        pendingBalanceBase,
        totalPrincipalPaid,
      );
      const customReference = await this.processor.generateReference(tenantId);

      const insertedPayment = await this.processor.insertPayment(
        {
          tenantId,
          loanId,
          paymentDate: new Date(paymentDate),
          paymentType: paymentType || 'PAYING',
          amount,
          balancePending: newBalancePending,
          bankId: bankId ?? undefined,
          paymentMethod,
          transactionReference,
          comment,
          userId,
          customReference,
        },
        tx,
      );



      for (const installment of installmentResult.paidInstallmentDetails) {
        await this.processor.insertPaymentDetail(
          insertedPayment.id,
          installment.id,
          installment.amount,
          userId,
          tx,
        );
        await this.processor.updateInstallmentPaid(installment.id, userId, tx);
      }

      if (installmentResult.partialInstallment) {
        await this.processor.updateInstallmentPartial(
          installmentResult.partialInstallment.id,
          installmentResult.partialInstallment.paidAmount,
          userId,
          tx,
        );

        const amountAppliedToPartial =
          installmentResult.partialInstallment.paidAmount -
          installmentResult.partialInstallment.originalPaidAmount;

        await this.processor.insertPaymentDetail(
          insertedPayment.id,
          installmentResult.partialInstallment.id,
          amountAppliedToPartial,
          userId,
          tx,
        );
      }

      const newLoanStatus =
        this.processor.determinNewLoanStatus(newBalancePending);
      const balanceInFavorValue = installmentResult.remainingAmount;

      await this.processor.updateLoanStatus(
        loanId,
        tenantId,
        newLoanStatus,
        balanceInFavorValue,
        userId,
        tx,
      );


      const roundedPayment = Number(appliedAmountExact.toFixed(2));
      const roundedInterest = Number(totalInterestPaid.toFixed(2));

      // Pago en exceso: se condona el interés de todas las cuotas cubiertas y
      // todo el dinero va a la cuenta del préstamo (capital).
      const hasExcess = balanceInFavorValue > 0;
      const effectiveInterest = hasExcess ? 0 : roundedInterest;
      const effectivePrincipal = Number(
        (roundedPayment - effectiveInterest).toFixed(2),
      );


      if (!liquidationActive) {
        await this.accounting.generatePaymentEntry(
          tenantId,
          userId,
          loan,
          amount,
          effectiveInterest,
          paymentDate ? new Date(paymentDate) : new Date(),
          tx,
        );

        this.audit.logPaymentCreated(
          userId,
          loan.associateFullname,
          insertedPayment.id,
          insertedPayment.customReference ?? '',
          {
            loanId,
            paymentDate,
            paymentType,
            amount,
            balancePending: String(newBalancePending.toFixed(6)),
            bankId: bankId ?? undefined,
            paymentMethod,
            transactionReference,
            comment,
            createdBy: userId,
            customReference: insertedPayment.customReference,
          },
        );
      }

      const acc = await this.processor.getAssociateAccount(
        loan.associateId,
        tx,
      );

      if (acc?.id) {
        if (effectivePrincipal > 0) {
          await this.processor.createAssociateMovement(
            userId,
            {
              associateAccountId: acc.id,
              movementType: AssociateMovementTypeEnum.LOAN_PAYMENT_DEBIT,
              amount: effectivePrincipal,
              currencyCode: 'VES' as CurrencyCodeEnum,
              transactionDate: paymentDate ? new Date(paymentDate) : undefined,
              description: `Pago Cuota Capital Préstamo Nº ${lockedLoan.customReference}`,
              referenceId: insertedPayment.id,
              referenceType: 'loansPayments',
              referenceNumber: insertedPayment.customReference ?? undefined,
              area: 'PRESTAMOS',
            },
            tenantId,
            tx,
          );
        }

        if (effectiveInterest > 0) {
          await this.processor.createAssociateMovement(
            userId,
            {
              associateAccountId: acc.id,
              movementType: AssociateMovementTypeEnum.LOAN_INTEREST_DEBIT,
              amount: effectiveInterest,
              currencyCode: 'VES' as CurrencyCodeEnum,
              transactionDate: paymentDate ? new Date(paymentDate) : undefined,
              description: `Pago Cuota Interés Préstamo Nº ${lockedLoan.customReference}`,
              referenceId: insertedPayment.id,
              referenceType: 'loansPayments',
              referenceNumber: insertedPayment.customReference ?? undefined,
              area: 'PRESTAMOS',
            },
            tenantId,
            tx,
          );
        }
      }

      if (bankId && !liquidationActive) {
        await this.bank.registerPaymentMovement(
          {
            bankAccountId: bankId,
            transactionDate: new Date(paymentDate) ?? new Date(),
            paymentMethod,
            description: `Pago de Cuota Prestamo Nº ${lockedLoan.customReference}`,
            bankReference: transactionReference,
            category: 'LOAN_PAYMENT' as BankTransactionCategory,
            creditAmount: amount,
            debitAmount: 0,
            createdBy: userId,
            internalRecordType: 'LOAN_PAYMENT',
            internalRecordId: String(acc?.id ?? ''),
          },
          userId,
          tenantId,
          tx,
        );
      }

      if (!liquidationActive) {

        if (balanceInFavorValue > EPSILON_COMPARISON && acc?.id) {
          await this.processor.createAssociateMovement(
            userId,
            {
              associateAccountId: acc.id,
              movementType: AssociateMovementTypeEnum.LOAN_PAYMENT_REVERSAL_CREDIT,
              amount: balanceInFavorValue,
              currencyCode: 'VES' as CurrencyCodeEnum,
              transactionDate: paymentDate ? new Date(paymentDate) : undefined,
              description: 'Ajuste a favor por cobro en exceso por pago de prestamo personal Nº' + lockedLoan.customReference,
              referenceId: loanId,
              referenceType: 'loans',
              area: 'PRESTAMOS',
            },
            tenantId,
            tx,
          );
        }
      }

      const createdPayload = {
        tenantId,
        paymentId: insertedPayment.id,
        loanId,
        associateId: loan.associateId,
        amount,
        paymentMethod,
        customReference: insertedPayment.customReference,
        timestamp: new Date().toISOString(),
      };

      await this.outbox.write(tx, {
        eventId: uuidv4(),
        eventType: LOAN_PAYMENT_EVENTS.CREATED,
        aggregateId: loanId,
        tenantId,
        payload: createdPayload,
      });

      if (!liquidationActive) {
        await this.outbox.write(tx, {
          eventId: uuidv4(),
          eventType: LOAN_PAYMENT_EVENTS.COMPLETED,
          aggregateId: loanId,
          tenantId,
          payload: {
            tenantId,
            loanId,
            associateId: loan.associateId,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return {
        transation: true,
        insertedPaymentId: insertedPayment.id,
        customReference: insertedPayment.customReference,
        balanceInFavorValue,
      };
    });

    return {
      message: 'Loan paid create success',
      transation: true,
      balanceInFavorValue: result.balanceInFavorValue,
      insertedPaymentId: result.insertedPaymentId,
      customReference: result.customReference,
    };
  }
}
