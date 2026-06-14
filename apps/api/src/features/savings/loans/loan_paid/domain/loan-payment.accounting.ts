import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import * as schema from '@/database/schema';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { CurrencyCodeEnum } from '@/types/enum';
import { format } from 'date-fns';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AccountingEntryItem, LoanInfo } from './loan-payment.types';

@Injectable()
export class LoanPaymentAccounting {
  constructor(
    private readonly accountingEntriesService: AccountingEntriesService,
  ) {}

  async generatePaymentEntry(
    tenantId: string,
    userId: string,
    loanData: LoanInfo,
    paymentAmount: number,
    principalAmount: number,
    interestAmount: number,
    paymentDate: Date,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<void> {
    const dateStr = format(paymentDate, 'dd/MM/yyyy');
    const fullname = loanData.associateFullname ?? 'ASOCIADO';

    const roundedPayment = Number(paymentAmount.toFixed(2));
    const roundedInterest = Number(interestAmount.toFixed(2));
    const roundedPrincipal = Number(
      (roundedPayment - roundedInterest).toFixed(2),
    );

    try {
      await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'savings',
          submodule: 'loans',
          category: 'SAVINGS_BANK',
          operationType: 'LOAN_PAYMENT',
          description: `Pago de Préstamo - ${fullname}`,
          entryDate: paymentDate,
          referenceValue: undefined,
          currencyCode: (loanData.currencyCode ?? 'VES') as CurrencyCodeEnum,
          originReferenceId: String(loanData.id),
          originType: 'LOAN_PAYMENT',
          items: [
            {
              associateId: loanData.associateId,
              amounts: {
                LOAN_PRINCIPAL: roundedPrincipal,
                LOAN_INTEREST_INCOME: roundedInterest,
                BANK_ACCOUNT: roundedPayment,
              },
              descriptions: {
                LOAN_PRINCIPAL: `Amortización de Capital - Prestamo del ${dateStr}`,
                LOAN_INTEREST_INCOME: `Intereses de Prestamo del ${dateStr}`,
                BANK_ACCOUNT: `Ingreso por Pago de Prestamo del ${dateStr}`,
              },
            },
          ],
          globalDescriptions: {
            LOAN_PRINCIPAL: `Amortización de Capital - Prestamo del ${dateStr}`,
            LOAN_INTEREST_INCOME: `Intereses de Prestamo del ${dateStr}`,
            BANK_ACCOUNT: `Ingreso por Pago de Prestamo del ${dateStr}`,
          },
        },
        tx,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException &&
        error.message.includes('No existe una regla contable')
      ) {
        throw new BadRequestException(
          'El sistema está configurado para asientos automáticos, pero no existe una regla contable creada para procesar el pago del préstamo. Por favor, contacte al administrador.',
        );
      }
      throw error;
    }
  }

  async generateReversalEntry(
    tenantId: string,
    userId: string,
    loanData: LoanInfo,
    paymentAmount: number,
    principalAmount: number,
    interestAmount: number,
    tx: NodePgDatabase<typeof schema>,
    paymentRef: string,
  ): Promise<void> {
    const fullname = loanData.associateFullname ?? 'ASOCIADO';

    const roundedPayment = Number(paymentAmount.toFixed(2));
    const roundedInterest = Number(interestAmount.toFixed(2));
    const roundedPrincipal = Number(
      (roundedPayment - roundedInterest).toFixed(2),
    );

    try {
      await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'savings',
          submodule: 'loans',
          category: 'SAVINGS_BANK',
          operationType: 'LOAN_PAYMENT',
          description: `ANULACIÓN: Pago de Préstamo - ${fullname} (Ref: ${paymentRef})`,
          entryDate: new Date(),
          currencyCode: (loanData.currencyCode ?? 'VES') as CurrencyCodeEnum,
          originReferenceId: String(loanData.id),
          originType: 'LOAN_PAYMENT_REVERSAL',
          items: [
            {
              associateId: loanData.associateId,
              amounts: {
                LOAN_PRINCIPAL: -roundedPrincipal,
                LOAN_INTEREST_INCOME: -roundedInterest,
                BANK_ACCOUNT: -roundedPayment,
              },
              descriptions: {
                LOAN_PRINCIPAL: `REVERSA: Amortización de Capital - Ref: ${paymentRef}`,
                LOAN_INTEREST_INCOME: `REVERSA: Intereses de Prestamo - Ref: ${paymentRef}`,
                BANK_ACCOUNT: `REVERSA: Ingreso por Pago de Prestamo - Ref: ${paymentRef}`,
              },
            },
          ],
          globalDescriptions: {
            LOAN_PRINCIPAL: `REVERSA: Amortización de Capital - Ref: ${paymentRef}`,
            LOAN_INTEREST_INCOME: `REVERSA: Intereses de Prestamo - Ref: ${paymentRef}`,
            BANK_ACCOUNT: `REVERSA: Ingreso por Pago de Prestamo - Ref: ${paymentRef}`,
          },
        },
        tx,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException &&
        error.message.includes('No existe una regla contable')
      ) {
        throw new BadRequestException(
          'Error en reversa contable: No existe una regla para procesar la anulación.',
        );
      }
      throw error;
    }
  }

  async generateBulkEntry(
    tenantId: string,
    userId: string,
    items: AccountingEntryItem[],
    totalAmount: number,
    paymentDate: Date,
    totalProcessed: number,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<void> {
    const roundedTotalPayment = Number(totalAmount.toFixed(2));

    items.push({
      associateId: 0,
      amounts: {
        BANK_ACCOUNT: roundedTotalPayment,
      },
      descriptions: {
        BANK_ACCOUNT: `Ingreso por Pagos de Préstamos (${totalProcessed} registros)`,
      },
    });

    try {
      await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'savings',
          submodule: 'loans',
          category: 'SAVINGS_BANK',
          operationType: 'LOAN_PAYMENT',
          description: `Carga Pagos de Préstamos - ${totalProcessed} registros`,
          entryDate: paymentDate,
          currencyCode: CurrencyCodeEnum.VES,
          originType: 'LOAN_PAYMENT',
          items: items as any,
        },
        tx,
      );
    } catch (error) {
      // accounting rule may not be configured
    }
  }
}
