import * as schema from '@/database/schema';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { CurrencyCodeEnum } from '@/types/enum';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { format } from 'date-fns';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AccountingEntryItem, LoanInfo } from './loan-payment.types';

@Injectable()
export class LoanPaymentAccounting {
  private readonly logger = new Logger(LoanPaymentAccounting.name);

  constructor(
    private readonly accountingEntriesService: AccountingEntriesService,
  ) { }

  async generatePaymentEntry(
    tenantId: string,
    userId: string,
    loanData: LoanInfo,
    paymentAmount: number,
    interestAmount: number,
    paymentDate: Date,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<void> {
    const dateStr = format(paymentDate, 'dd/MM/yyyy');
    const fullname = loanData.associateFullname ?? 'ASOCIADO';
    const referenceValue = loanData.loanTypeName ?? 'Pago Prestamo';

    const roundedPayment = Number(paymentAmount.toFixed(2));
    const roundedInterest = Number(interestAmount.toFixed(2));
    const loanPaymentAmount = Number(
      (roundedPayment - roundedInterest).toFixed(2),
    );

    const amounts: Record<string, number> = {
      LOAN_PAYMENT: loanPaymentAmount,
      LOAN_INTEREST_INCOME: roundedInterest,
      BANK_ACCOUNT: roundedPayment,
    };

    this.logger.log(
      `[generatePaymentEntry] Asiento a generar: payment=${roundedPayment} interest=${roundedInterest} loanPayment=${loanPaymentAmount} ref=${referenceValue}`,
    );

    const descriptions: Record<string, string> = {
      LOAN_PAYMENT: `PAGO PRESTAMO DEL ${dateStr}`,
      LOAN_INTEREST_INCOME: `INTERESES PRESTAMO DEL ${dateStr}`,
      BANK_ACCOUNT: `PAGO PRESTAMO DEL ${dateStr}`,
    };

    try {
      const entry = await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'portfolio',
          submodule: 'loans',
          category: 'SAVINGS_BANK',
          operationType: 'LOAN_PAYMENT_INDIVIDUAL',
          description: `Pago de Préstamo - ${fullname}`,
          entryDate: paymentDate,
          referenceValue,
          autoPostKey: 'AUTO_POST_ENTRY_LOANS_PAYMENT',
          currencyCode: (loanData.currencyCode ?? 'VES') as CurrencyCodeEnum,
          originReferenceId: String(loanData.id),
          originType: 'LOAN_PAYMENT',
          items: [
            {
              associateId: loanData.associateId,
              amounts,
              descriptions,
            },
          ],
          globalDescriptions: descriptions,
        },
        tx,
      );

      if (!entry) {
        this.logger.warn(
          `[generatePaymentEntry] El asiento automático fue omitido (auto-posting desactivado o regla no aplicable) para el préstamo ${loanData.id}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[generatePaymentEntry] Error generando asiento automático: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
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
    const referenceValue = loanData.loanTypeName ?? 'Pago Prestamo';

    const roundedPayment = Number(paymentAmount.toFixed(2));

    try {
      await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'portfolio',
          submodule: 'loans',
          category: 'SAVINGS_BANK',
          operationType: 'LOAN_PAYMENT_INDIVIDUAL',
          description: `ANULACIÓN: Pago de Préstamo - ${fullname} (Ref: ${paymentRef})`,
          entryDate: new Date(),
          referenceValue,
          autoPostKey: 'AUTO_POST_ENTRY_LOANS_PAYMENT',
          currencyCode: (loanData.currencyCode ?? 'VES') as CurrencyCodeEnum,
          originReferenceId: String(loanData.id),
          originType: 'LOAN_PAYMENT_REVERSAL',
          items: [
            {
              associateId: loanData.associateId,
              amounts: {
                LOAN_PAYMENT: -principalAmount,
                LOAN_INTEREST_INCOME: -interestAmount,
                BANK_ACCOUNT: -roundedPayment,
              },
              descriptions: {
                LOAN_PAYMENT: `REVERSA: CUOTA PRESTAMO - Ref: ${paymentRef}`,
                LOAN_INTEREST_INCOME: `REVERSA INTERESES PRESTAMO DEL ${paymentRef}`,
                BANK_ACCOUNT: `REVERSA: PAGO PRESTAMO - Ref: ${paymentRef}`,
              },
            },
          ],
          globalDescriptions: {
            LOAN_PAYMENT: `REVERSA: CUOTA PRESTAMO - Ref: ${paymentRef}`,
            LOAN_INTEREST_INCOME: `REVERSA INTERESES PRESTAMO DEL ${paymentRef}`,
            BANK_ACCOUNT: `REVERSA: PAGO PRESTAMO - Ref: ${paymentRef}`,
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
    loanTypeName: string,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<void> {
    const roundedTotalPayment = Number(totalAmount.toFixed(2));
    const referenceValue = loanTypeName || 'Pago Prestamo';

    items.push({
      associateId: 0,
      amounts: {
        LOAN_WITHHOLDING: roundedTotalPayment,
      },
      descriptions: {
        LOAN_WITHHOLDING: `RETENCIONES DE PRESTAMOS (${totalProcessed} registros)`,
      },
    });

    try {
      await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'portfolio',
          submodule: 'loans',
          category: 'SAVINGS_BANK',
          operationType: 'LOAN_PAYMENT_MASSIVE',
          description: `Carga Pagos de Préstamos - ${totalProcessed} registros`,
          entryDate: paymentDate,
          referenceValue,
          autoPostKey: 'AUTO_POST_ENTRY_LOANS_PAYMENT',
          currencyCode: CurrencyCodeEnum.VES,
          originType: 'LOAN_PAYMENT',
          items: items as any,
        },
        tx,
      );
    } catch (error) {
      this.logger.error(
        `[generateBulkEntry] No se pudo generar el asiento contable masivo: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
