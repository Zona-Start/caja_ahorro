import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { associateAccounts, loanPaymentsDetails, loans } from '@/database/schema';
import {
  AssociateMovementTypeEnum,
  CurrencyCodeEnum,
} from '@/types/enum';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { v4 as uuidv4 } from 'uuid';
import { OutboxWriterService } from '@/shared/outbox';
import { LoanPaymentValidator } from '../domain/loan-payment.validator';
import { LoanPaymentProcessor } from '../domain/loan-payment.processor';
import { LoanPaymentAccounting } from '../domain/loan-payment.accounting';
import { LoanPaymentAudit } from '../domain/loan-payment.audit';
import { LoanPaymentEvents } from '../domain/loan-payment.events';
import { LOAN_PAYMENT_EVENTS } from '../events/loan-payment.events';

@Injectable()
export class CancelPaymentUseCase {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly outbox: OutboxWriterService,
    private readonly validator: LoanPaymentValidator,
    private readonly processor: LoanPaymentProcessor,
    private readonly accounting: LoanPaymentAccounting,
    private readonly audit: LoanPaymentAudit,
    private readonly events: LoanPaymentEvents,
  ) {}

  async execute(paymentId: string, tenantId: string, userId: string) {
    return await this.db.transaction(async (tx) => {
      const payment = await this.validator.findPaymentWithDetails(paymentId, tenantId, tx);

      if (!payment) {
        throw new NotFoundException('The payment was not found.');
      }

      this.validator.validatePaymentHasLoan(payment);
      this.validator.validatePaymentNotCancelled(payment);

      const paymentDetails = await tx.query.loanPaymentsDetails.findMany({
        where: eq(loanPaymentsDetails.loanPaymentId, paymentId),
      });

      let totalPrincipalReverted = 0;
      let totalInterestReverted = 0;

      for (const detail of paymentDetails) {
        const installmentId = detail.installmentId;
        const amountToRevert = Number(detail.amount);

        if (installmentId == null) {
          throw new InternalServerErrorException('installmentId is null or undefined.');
        }

        await this.processor.cancelPaymentDetail(detail.id, tx);

        const reverted = await this.processor.revertInstallment(
          installmentId, amountToRevert, userId, tx,
        );

        totalPrincipalReverted += reverted.principalReverted;
        totalInterestReverted += reverted.interestReverted;
      }

      const paymentCount = await this.validator.countPaymentsForLoan(
        payment.loanId!, tenantId, tx,
      );

      const newStatusLoan = paymentCount === 1 ? 'DISBURSED' : 'IN_PAYMENT';

      await tx
        .update(loans)
        .set({ status: newStatusLoan as any, updatedById: userId })
        .where(eq(loans.id, payment.loanId!));

      await this.processor.cancelPayment(paymentId, tenantId, userId, tx);

      const associateAccount = await tx.query.associateAccounts.findFirst({
        where: eq(associateAccounts.associateId, payment.associateId ?? ''),
      });

      if (associateAccount) {
        await this.processor.createAssociateMovement(
          userId,
          {
            associateAccountId: associateAccount.id,
            movementType: AssociateMovementTypeEnum.LOAN_PAYMENT_REVERSAL_CREDIT,
            amount: Number(payment.amount),
            currencyCode: 'VES' as CurrencyCodeEnum,
            description: `REVERSO PAGO PRESTAMO - REF: ${payment.customReference}`,
            referenceId: payment.id,
            referenceType: 'loanPayments',
            area: 'PRESTAMOS',
          },
          tenantId, tx,
        );
      }

      await this.accounting.generateReversalEntry(
        tenantId, userId,
        {
          id: payment.loanId!,
          associateId: payment.associateId ?? '',
          status: '',
          currencyCode: payment.currencyCode,
          associateFullname: payment.associateFullname,
        },
        Number(payment.amount),
        totalPrincipalReverted,
        totalInterestReverted,
        tx,
        payment.customReference ?? '',
      );

      this.audit.logPaymentCancelled(userId, paymentId, payment.customReference ?? '');
      this.events.emitPaymentCancelled(payment.loanId!, paymentId);

      await this.outbox.write(tx, {
        eventId: uuidv4(),
        eventType: LOAN_PAYMENT_EVENTS.CANCELLED,
        aggregateId: payment.loanId!,
        tenantId,
        payload: {
          tenantId,
          paymentId,
          loanId: payment.loanId!,
          associateId: payment.associateId ?? '',
          amount: Number(payment.amount),
          customReference: payment.customReference ?? '',
          timestamp: new Date().toISOString(),
        },
      });

      return {
        message: `The payment ${payment.customReference} has been successfully cancelled.`,
      };
    });
  }
}
