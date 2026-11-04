import { calculateForeignExchangeGain } from '@/common/utils/foreign-exchange-gain';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  loanAmortizationSchedule,
  loanPayments,
  loans,
} from '@/database/schema';
import { ExchangeRateService } from '@/features/core/exchange-rate/exchange-rate.service';
import { OutboxWriterService } from '@/shared/outbox';
import {
  AssociateMovementTypeEnum,
  BankTransactionCategory,
  CurrencyCodeEnum,
} from '@/types/enum';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, ne } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { v4 as uuidv4 } from 'uuid';
import { LoanPaymentAccounting } from '../domain/loan-payment.accounting';
import { LoanPaymentAudit } from '../domain/loan-payment.audit';
import { LoanPaymentBank } from '../domain/loan-payment.bank';
import { LoanPaymentProcessor } from '../domain/loan-payment.processor';
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
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

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
      exchangeRate: dtoExchangeRate,
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

      // El monto del pago está en la moneda del préstamo. Se calcula su
      // equivalente en Bs a la tasa del día de pago (editable). Solo se trata
      // como divisa si el préstamo tiene una tasa congelada guardada.
      const loanHasFx =
        Number(lockedLoan.exchangeRate ?? 0) > 0 &&
        !!lockedLoan.currencyCode &&
        lockedLoan.currencyCode !== 'VES';
      const loanCurrency = (
        loanHasFx ? lockedLoan.currencyCode : 'VES'
      ) as CurrencyCodeEnum;
      let paymentRate =
        loanCurrency === CurrencyCodeEnum.VES
          ? 1
          : Number(dtoExchangeRate ?? 0);
      if (
        loanCurrency !== CurrencyCodeEnum.VES &&
        (!Number.isFinite(paymentRate) || paymentRate <= 0)
      ) {
        paymentRate = await this.exchangeRateService.getRate(
          tenantId,
          paymentDate ? new Date(paymentDate) : new Date(),
          loanCurrency,
        );
      }
      const paymentAmountBase = +(amount * paymentRate).toFixed(4);

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
          loanHasFx,
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
          currencyCode: loanCurrency,
          exchangeRate: paymentRate,
          amountBase: paymentAmountBase,
          amountForeign: amount,
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

      // El interés solo se condona cuando el pago liquida toda la deuda. Un
      // pequeño exceso sobre una cuota no debe eliminar el interés del pago.
      const closesDebt = newBalancePending <= 0;
      const effectiveInterest = closesDebt ? 0 : roundedInterest;
      const effectivePrincipal = Number(
        (roundedPayment - effectiveInterest).toFixed(2),
      );
      const effectivePrincipalBs = +(effectivePrincipal * paymentRate).toFixed(
        2,
      );
      const effectiveInterestBs = +(effectiveInterest * paymentRate).toFixed(2);

      let foreignExchangeGain = 0;
      const isForeignLoan =
        !!loan.currencyCode &&
        loan.currencyCode !== 'VES' &&
        Number(loan.exchangeRate ?? 0) > 0;
      if (!liquidationActive && isForeignLoan && newBalancePending <= 0) {
        // Se reconstruye el saldo contable en Bs usando los pagos anteriores:
        // la diferencia cambiaria acumulada se reconoce al liquidar la deuda.
        const priorPayments = await tx
          .select({
            balancePending: loanPayments.balancePending,
            exchangeRate: loanPayments.exchangeRate,
          })
          .from(loanPayments)
          .where(
            and(
              eq(loanPayments.loanId, loanId),
              eq(loanPayments.tenantId, tenantId),
              eq(loanPayments.status, 'DONE'),
              ne(loanPayments.id, insertedPayment.id),
            ),
          )
          .orderBy(asc(loanPayments.createdAt));

        let originalPrincipalForeign = pendingBalanceBase;
        if (priorPayments.length > 0) {
          const scheduleRows = await tx
            .select({
              principalAmount: loanAmortizationSchedule.principalAmount,
            })
            .from(loanAmortizationSchedule)
            .where(eq(loanAmortizationSchedule.loanId, loanId));
          originalPrincipalForeign = scheduleRows.reduce(
            (sum, row) => sum + Number(row.principalAmount ?? 0),
            0,
          );
        }

        foreignExchangeGain = calculateForeignExchangeGain({
          currencyCode: loan.currencyCode,
          paymentRate,
          creationRate: Number(loan.exchangeRate ?? 0),
          pendingPrincipalForeign: pendingBalanceBase,
          originalPrincipalForeign,
          priorPayments,
          closesDebt: true,
        });
      }

      if (!liquidationActive) {
        await this.accounting.generatePaymentEntry(
          tenantId,
          userId,
          loan,
          paymentAmountBase,
          effectiveInterestBs,
          paymentDate ? new Date(paymentDate) : new Date(),
          tx,
          foreignExchangeGain,
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
        if (effectivePrincipalBs > 0) {
          await this.processor.createAssociateMovement(
            userId,
            {
              associateAccountId: acc.id,
              movementType: AssociateMovementTypeEnum.LOAN_PAYMENT_DEBIT,
              amount: effectivePrincipalBs,
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

        if (effectiveInterestBs > 0) {
          await this.processor.createAssociateMovement(
            userId,
            {
              associateAccountId: acc.id,
              movementType: AssociateMovementTypeEnum.LOAN_INTEREST_DEBIT,
              amount: effectiveInterestBs,
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
            creditAmount: paymentAmountBase,
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
        if (balanceInFavorValue > 0.000001 && acc?.id) {
          await this.processor.createAssociateMovement(
            userId,
            {
              associateAccountId: acc.id,
              movementType:
                AssociateMovementTypeEnum.LOAN_PAYMENT_REVERSAL_CREDIT,
              amount: +(balanceInFavorValue * paymentRate).toFixed(2),
              currencyCode: 'VES' as CurrencyCodeEnum,
              transactionDate: paymentDate ? new Date(paymentDate) : undefined,
              description:
                'Ajuste a favor por cobro en exceso por pago de prestamo personal Nº' +
                lockedLoan.customReference,
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
