import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { associates, loans } from '@/database/schema';
import {
  AssociateMovementTypeEnum,
  CurrencyCodeEnum,
  LoanStatusEnum,
} from '@/types/enum';
import { and, eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { v4 as uuidv4 } from 'uuid';
import { OutboxWriterService } from '@/shared/outbox';
import * as ExcelJS from 'exceljs';
import { LoanPaymentValidator } from '../domain/loan-payment.validator';
import { LoanPaymentProcessor } from '../domain/loan-payment.processor';
import { LoanPaymentAccounting } from '../domain/loan-payment.accounting';
import { LOAN_PAYMENT_EVENTS } from '../events/loan-payment.events';

@Injectable()
export class BulkPaymentUseCase {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly outbox: OutboxWriterService,
    private readonly validator: LoanPaymentValidator,
    private readonly processor: LoanPaymentProcessor,
    private readonly accounting: LoanPaymentAccounting,
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
    dto?: { paymentDate?: string },
  ) {
    if (!file) throw new BadRequestException('Archivo Excel no proporcionado');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.getWorksheet(1);
    const itemsFromExcel: { cedula: string; amount: number; fecha: Date }[] = [];
    let finalPaymentDate: Date = new Date();

    if (!worksheet)
      throw new BadRequestException(
        'No se encontró la hoja de trabajo en el Excel',
      );

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const cedula = row.getCell(1).value?.toString().trim();
        const amountValue = row.getCell(2).value;
        const amount =
          typeof amountValue === 'number'
            ? amountValue
            : parseFloat(amountValue?.toString() || '0');
        const dateValue = row.getCell(3).value?.toString().trim();
        finalPaymentDate = dateValue ? new Date(dateValue) : new Date();

        if (cedula && !isNaN(amount) && amount > 0) {
          itemsFromExcel.push({ cedula, amount, fecha: finalPaymentDate });
        }
      }
    });

    if (itemsFromExcel.length === 0)
      throw new BadRequestException(
        'El archivo Excel está vacío o no tiene el formato correcto (Col 1: Cedula, Col 2: Monto, Col 3: Fecha)',
      );

    const results = {
      success: [] as any[],
      errors: [] as any[],
      totalProcessed: 0,
    };

    const outboxEntries: Array<{
      eventId: string;
      eventType: string;
      aggregateId: string;
      tenantId: string;
      payload: any;
    }> = [];

    const result = await this.db.transaction(async (tx) => {
      let bulkTotalPrincipal = 0;
      let bulkTotalInterest = 0;
      let totalAmountApplied = 0;
      const accountingItemsForEntry: any[] = [];

      for (const item of itemsFromExcel) {
        try {
          const associate = await this.validator.findAssociateByCedula(
            item.cedula, tenantId, tx,
          );

          if (!associate) {
            results.errors.push({
              cedula: item.cedula, error: 'Asociado no encontrado',
            });
            continue;
          }

          const activeLoans = await tx
            .select({
              id: loans.id,
              currencyCode: loans.currencyCode,
            })
            .from(loans)
            .where(
              and(
                eq(loans.tenantId, tenantId),
                eq(loans.associateId, associate.id),
                inArray(loans.status, [
                  LoanStatusEnum.DISBURSED,
                  LoanStatusEnum.IN_PAYMENT,
                ]),
              ),
            );

          const loan = activeLoans[0];
          if (!loan) {
            results.errors.push({
              cedula: item.cedula, error: 'No se encontró préstamo activo',
            });
            continue;
          }

          const installmentResult = await this.validator.calculateCoveredInstallments(
            loan.id, item.amount, tx,
          );

          const appliedAmountExact = this.processor.getAppliedAmount(
            item.amount, installmentResult.remainingAmount,
          );

          if (appliedAmountExact <= 0) {
            results.errors.push({
              cedula: item.cedula, error: 'Monto insuficiente para abonar',
            });
            continue;
          }

          const currentBalance = await this.validator.calculateBalancePending(loan.id, tx);
          const newBalancePending = this.processor.getNewBalancePending(
            currentBalance, appliedAmountExact,
          );

          const customReference = await this.processor.generateReference(tenantId);

          const insertedPayment = await this.processor.insertPayment(
            {
              tenantId,
              loanId: loan.id,
              paymentDate: item.fecha instanceof Date ? item.fecha : new Date(item.fecha),
              paymentType: 'PAYING',
              amount: item.amount,
              balancePending: newBalancePending,
              bankId: undefined,
              paymentMethod: 'BANK_TRANSFER',
              transactionReference: customReference,
              comment: 'Carga Masiva Excel',
              userId,
              customReference,
            },
            tx,
          );

          let localPrincipal = 0;
          let localInterest = 0;

          for (const inst of installmentResult.paidInstallmentDetails) {
            localPrincipal += inst.principal;
            localInterest += inst.interest;

            await this.processor.insertPaymentDetail(
              insertedPayment.id, inst.id, inst.amount, userId, tx,
            );
            await this.processor.updateInstallmentPaid(inst.id, userId, tx);
          }

          if (installmentResult.partialInstallment) {
            localPrincipal += installmentResult.partialInstallment.principal;
            localInterest += installmentResult.partialInstallment.interest;

            await this.processor.updateInstallmentPartial(
              installmentResult.partialInstallment.id,
              installmentResult.partialInstallment.paidAmount,
              userId, tx,
            );

            const amountAppliedToPartial =
              installmentResult.partialInstallment.paidAmount -
              installmentResult.partialInstallment.originalPaidAmount;

            await this.processor.insertPaymentDetail(
              insertedPayment.id,
              installmentResult.partialInstallment.id,
              amountAppliedToPartial,
              userId, tx,
            );
          }

          const newLoanStatus = this.processor.determinNewLoanStatus(newBalancePending);

          await this.processor.updateLoanStatus(
            loan.id, tenantId, newLoanStatus, installmentResult.remainingAmount, userId, tx,
          );

          const acc = await this.processor.getAssociateAccount(associate.id, tx);

          if (acc?.id) {
            await this.processor.createAssociateMovement(
              userId,
              {
                associateAccountId: acc.id,
                movementType: AssociateMovementTypeEnum.LOAN_PAYMENT_DEBIT,
                amount: item.amount,
                currencyCode: (loan.currencyCode ?? 'VES') as CurrencyCodeEnum,
                transactionDate: item.fecha instanceof Date ? item.fecha : new Date(item.fecha),
                description: 'Pago Préstamo (Carga Masiva Excel)',
                referenceId: insertedPayment.id,
                referenceType: 'loansPayments',
              },
              tenantId, tx,
            );
          }

          const roundedPayment = Number(appliedAmountExact.toFixed(2));
          const roundedInterest = Number(localInterest.toFixed(2));
          const roundedPrincipal = Number(
            (roundedPayment - roundedInterest).toFixed(2),
          );

          accountingItemsForEntry.push({
            associateId: associate.id,
            amounts: {
              LOAN_PRINCIPAL: roundedPrincipal,
              LOAN_INTEREST_INCOME: roundedInterest,
            },
            descriptions: {
              LOAN_PRINCIPAL: `Amortización de Capital - Préstamo del Asociado ${associate.fullname}`,
              LOAN_INTEREST_INCOME: `Intereses - Préstamo del Asociado ${associate.fullname}`,
            },
          });

          bulkTotalPrincipal += roundedPrincipal;
          bulkTotalInterest += roundedInterest;
          totalAmountApplied += roundedPayment;

          results.success.push({
            cedula: item.cedula,
            ref: insertedPayment.customReference,
          });
          results.totalProcessed++;

          outboxEntries.push({
            eventId: uuidv4(),
            eventType: LOAN_PAYMENT_EVENTS.CREATED,
            aggregateId: loan.id,
            tenantId,
            payload: {
              tenantId,
              paymentId: insertedPayment.id,
              loanId: loan.id,
              associateId: associate.id,
              amount: item.amount,
              paymentMethod: 'BANK_TRANSFER',
              customReference: insertedPayment.customReference ?? '',
              timestamp: new Date().toISOString(),
            },
          });
        } catch (err) {
          results.errors.push({
            cedula: item.cedula,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      if (results.totalProcessed > 0) {
        await this.accounting.generateBulkEntry(
          tenantId, userId,
          accountingItemsForEntry,
          totalAmountApplied, finalPaymentDate,
          results.totalProcessed, tx,
        );
      }

      await this.outbox.writeMany(tx, outboxEntries);

      return results;
    });

    return result;
  }
}
