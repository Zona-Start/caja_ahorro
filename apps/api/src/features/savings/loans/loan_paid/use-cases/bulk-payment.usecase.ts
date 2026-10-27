import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { loans, loanTypes } from '@/database/schema';
import { OutboxWriterService } from '@/shared/outbox';
import {
  AssociateMovementTypeEnum,
  CurrencyCodeEnum,
  LoanStatusEnum,
} from '@/types/enum';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { LoanPaymentAccounting } from '../domain/loan-payment.accounting';
import { LoanPaymentProcessor } from '../domain/loan-payment.processor';
import { LoanPaymentValidator } from '../domain/loan-payment.validator';
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
    const itemsFromExcel: { cedula: string; amount: number }[] = [];

    if (!worksheet)
      throw new BadRequestException(
        'No se encontró la hoja de trabajo en el Excel',
      );

    // La fecha de pago se lee de la celda B1 (fila 1: "fecha" | yyyy-MM-dd)
    const cellB1Value = worksheet.getCell('B1').value?.toString().trim();
    const parsedDate = cellB1Value ? new Date(cellB1Value) : null;
    const finalPaymentDate =
      parsedDate && !isNaN(parsedDate.getTime())
        ? parsedDate
        : dto?.paymentDate
          ? new Date(dto.paymentDate)
          : new Date();

    // Los datos inician en la fila 3 (fila 1: fecha, fila 2: encabezados)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 2) {
        const cedula = row.getCell(1).value?.toString().trim();
        const amountValue = row.getCell(2).value;
        const amount =
          typeof amountValue === 'number'
            ? amountValue
            : parseFloat(amountValue?.toString() || '0');

        if (cedula && !isNaN(amount) && amount > 0) {
          itemsFromExcel.push({ cedula, amount });
        }
      }
    });

    if (itemsFromExcel.length === 0)
      throw new BadRequestException(
        'El archivo Excel está vacío o no tiene el formato correcto (Fila 1: fecha, Fila 2: cedula/monto, Fila 3+: datos)',
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
      const accountingGroups = new Map<
        string,
        { items: any[]; totalAmount: number; count: number }
      >();

      for (const item of itemsFromExcel) {
        try {
          const associate = await this.validator.findAssociateByCedula(
            item.cedula,
            tenantId,
            tx,
          );

          if (!associate) {
            results.errors.push({
              cedula: item.cedula,
              error: 'Asociado no encontrado',
            });
            continue;
          }

          const activeLoans = await tx
            .select({
              id: loans.id,
              customReference: loans.customReference,
              currencyCode: loans.currencyCode,
              exchangeRate: loans.exchangeRate,
              loanTypeId: loans.loanTypeId,
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
            )
            .for('update');

          const loan = activeLoans[0];

          //Cargamos saldo a favor del asociado si existe un pago pero no existe prestamo activo
          if (!loan && item.amount > 0) {
            const [lastPaidLoan] = await tx
              .select({
                id: loans.id,
                associateId: loans.associateId,
                currencyCode: loans.currencyCode,
                customReference: loans.customReference,
                loanTypesName: loanTypes.name,
              })
              .from(loans)
              .leftJoin(loanTypes, eq(loanTypes.id, loans.loanTypeId))
              .where(
                and(
                  eq(loans.tenantId, tenantId),
                  eq(loans.associateId, associate.id),
                  eq(loans.status, LoanStatusEnum.PAID),
                ),
              )
              .orderBy(desc(loans.startDate))
              .limit(1);

            if (lastPaidLoan) {
              const acc = await this.processor.getAssociateAccount(
                associate.id,
                tx,
              );

              await this.processor.createAssociateMovement(
                userId,
                {
                  associateAccountId: acc?.id,
                  movementType:
                    AssociateMovementTypeEnum.LOAN_PAYMENT_REVERSAL_CREDIT,
                  amount: item.amount,
                  currencyCode: 'VES' as CurrencyCodeEnum,
                  transactionDate: finalPaymentDate,
                  description:
                    'Ajuste a favor por cobro en exceso por pago de prestamo personal Nº' +
                    lastPaidLoan.customReference,
                  referenceId: lastPaidLoan.id,
                  referenceType: 'loans',
                },
                tenantId,
                tx,
              );

              let group = accountingGroups.get(
                lastPaidLoan.loanTypesName ?? 'PRESTAMOS PERSONALES (CP)',
              );
              if (!group) {
                group = { items: [], totalAmount: 0, count: 0 };
                accountingGroups.set(
                  lastPaidLoan.loanTypesName ?? 'PRESTAMOS PERSONALES (CP)',
                  group,
                );
              }

              group.items.push({
                associateId: associate.id,
                amounts: {
                  LOAN_PAYMENT: item.amount,
                  LOAN_INTEREST_INCOME: 0,
                },
                descriptions: {
                  LOAN_PAYMENT: `CUOTA PRESTAMO - Asociado ${associate.fullname}`,
                  LOAN_INTEREST_INCOME: `INTERES PRESTAMO - Asociado ${associate.fullname}`,
                },
              });

              group.totalAmount += item.amount;
              group.count++;
              results.success.push({
                cedula: item.cedula,
                error:
                  'Asocido sin prestamo, Saldo cargado a favor como exceso',
              });
              results.totalProcessed++;
            } else {
              results.errors.push({
                cedula: item.cedula,
                error:
                  'Verificar Asociado no tiene ningun prestamo registrado del cual tenga alguna cuota en exceso,',
              });
              continue;
            }
          } else {
            const [loanType] = await tx
              .select({ name: loanTypes.name })
              .from(loanTypes)
              .where(eq(loanTypes.id, loan.loanTypeId));
            const loanTypeName = loanType?.name ?? 'Pago Prestamo';

            // Los montos de la carga están en la moneda del préstamo; los
            // movimientos y la contabilidad se registran en Bs.
            const bulkRate =
              loan.currencyCode === CurrencyCodeEnum.VES
                ? 1
                : Number(loan.exchangeRate ?? 0) || 1;

            const pendingBalanceBase =
              await this.validator.getPendingBalanceBase(loan.id, tx);

            const installmentResult =
              await this.validator.calculateCoveredInstallments(
                loan.id,
                item.amount,
                tx,
                pendingBalanceBase,
              );

            const appliedAmountExact = this.processor.getAppliedAmount(
              item.amount,
              installmentResult.remainingAmount,
            );

            if (appliedAmountExact <= 0) {
              results.errors.push({
                cedula: item.cedula,
                error: 'Monto insuficiente para abonar',
              });
              continue;
            }

            let localPrincipal = 0;
            let localInterest = 0;

            for (const inst of installmentResult.paidInstallmentDetails) {
              localPrincipal += inst.principal;
              localInterest += inst.interest;
            }

            if (installmentResult.partialInstallment) {
              localPrincipal += installmentResult.partialInstallment.principal;
              localInterest += installmentResult.partialInstallment.interest;
            }

            const newBalancePending = this.processor.getNewBalancePending(
              pendingBalanceBase,
              localPrincipal,
            );

            const customReference =
              await this.processor.generateReference(tenantId);

            const insertedPayment = await this.processor.insertPayment(
              {
                tenantId,
                loanId: loan.id,
                paymentDate: finalPaymentDate,
                paymentType: 'PAYING',
                amount: item.amount,
                currencyCode: loan.currencyCode ?? 'VES',
                exchangeRate: bulkRate,
                amountBase: +(item.amount * bulkRate).toFixed(4),
                amountForeign: item.amount,
                balancePending: newBalancePending,
                bankId: undefined,
                paymentMethod: 'BANK_TRANSFER',
                transactionReference: customReference,
                comment: 'Carga Pagos Masiva Excel',
                userId,
                customReference,
              },
              tx,
            );

            for (const inst of installmentResult.paidInstallmentDetails) {
              await this.processor.insertPaymentDetail(
                insertedPayment.id,
                inst.id,
                inst.amount,
                userId,
                tx,
              );
              await this.processor.updateInstallmentPaid(inst.id, userId, tx);
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

            await this.processor.updateLoanStatus(
              loan.id,
              tenantId,
              newLoanStatus,
              installmentResult.remainingAmount,
              userId,
              tx,
            );

            const acc = await this.processor.getAssociateAccount(
              associate.id,
              tx,
            );

            const roundedPayment = Number(appliedAmountExact.toFixed(2));
            const roundedInterest = Number(localInterest.toFixed(2));

            // Pago en exceso: se condona el interés de todas las cuotas
            // cubiertas y todo el dinero va a la cuenta del préstamo (capital).
            const hasExcess = installmentResult.remainingAmount > 0;
            const effectiveInterest = hasExcess ? 0 : roundedInterest;
            const effectivePrincipal = Number(
              (roundedPayment - effectiveInterest).toFixed(2),
            );

            if (acc?.id) {
              if (effectivePrincipal > 0) {
                await this.processor.createAssociateMovement(
                  userId,
                  {
                    associateAccountId: acc.id,
                    movementType: AssociateMovementTypeEnum.LOAN_PAYMENT_DEBIT,
                    amount: +(effectivePrincipal * bulkRate).toFixed(2),
                    currencyCode: 'VES' as CurrencyCodeEnum,
                    transactionDate: finalPaymentDate,
                    description: `Pago Cuota Capital Préstamo Nº ${loan.customReference}`,
                    referenceId: insertedPayment.id,
                    referenceType: 'loansPayments',
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
                    movementType: AssociateMovementTypeEnum.LOAN_PAYMENT_DEBIT,
                    amount: +(effectiveInterest * bulkRate).toFixed(2),
                    currencyCode: 'VES' as CurrencyCodeEnum,
                    transactionDate: finalPaymentDate,
                    description: `Pago Cuota Interés Préstamo Nº ${loan.customReference}`,
                    referenceId: insertedPayment.id,
                    referenceType: 'loansPayments',
                  },
                  tenantId,
                  tx,
                );
              }
              if (hasExcess) {
                await this.processor.createAssociateMovement(
                  userId,
                  {
                    associateAccountId: acc.id,
                    movementType:
                      AssociateMovementTypeEnum.LOAN_PAYMENT_REVERSAL_CREDIT,
                    amount: +(
                      installmentResult.remainingAmount * bulkRate
                    ).toFixed(2),
                    currencyCode: 'VES' as CurrencyCodeEnum,
                    transactionDate: finalPaymentDate,
                    description:
                      'Ajuste a favor por cobro en exceso por pago de prestamo personal Nº' +
                      loan.customReference,
                    referenceId: loan.id,
                    referenceType: 'loans',
                  },
                  tenantId,
                  tx,
                );
              }
            }

            let group = accountingGroups.get(loanTypeName);
            if (!group) {
              group = { items: [], totalAmount: 0, count: 0 };
              accountingGroups.set(loanTypeName, group);
            }

            group.items.push({
              associateId: associate.id,
              amounts: hasExcess
                ? {
                    LOAN_PAYMENT: +(item.amount * bulkRate).toFixed(2),
                    LOAN_INTEREST_INCOME: 0,
                  }
                : {
                    LOAN_PAYMENT: +(effectivePrincipal * bulkRate).toFixed(2),
                    LOAN_INTEREST_INCOME: +(effectiveInterest * bulkRate).toFixed(
                      2,
                    ),
                  },
              descriptions: {
                LOAN_PAYMENT: `CUOTA PRESTAMO - Asociado ${associate.fullname}`,
                LOAN_INTEREST_INCOME: `INTERES PRESTAMO - Asociado ${associate.fullname}`,
              },
            });

            group.totalAmount +=
              (hasExcess ? item.amount : roundedPayment) * bulkRate;
            group.count++;

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
          }
        } catch (err) {
          results.errors.push({
            cedula: item.cedula,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      if (results.totalProcessed > 0) {
        for (const [loanTypeName, group] of accountingGroups) {
          await this.accounting.generateBulkEntry(
            tenantId,
            userId,
            group.items,
            group.totalAmount,
            finalPaymentDate,
            group.count,
            loanTypeName,
            tx,
          );
        }
      }

      await this.outbox.writeMany(tx, outboxEntries);

      return results;
    });

    return result;
  }
}
