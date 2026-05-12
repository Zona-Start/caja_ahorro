import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  associateAccounts,
  associates,
  bankDirectory,
  loanAmortizationSchedule,
  loanPayments,
  loanPaymentsDetails,
  loans,
  loanTypes,
} from '@/database/schema';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import {
  AssociateMovementTypeEnum,
  BankTransactionCategory,
  CurrencyCodeEnum,
  loanPaymetTypeEnum,
  LoanStatusEnum,
  paymentMethodEnum,
} from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { format } from 'date-fns';
import { and, eq, ilike, inArray, ne, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as ExcelJS from 'exceljs';
import { AssociateAccountsMovementsService } from '../../parnerts/associate-accounts-movements/associate-accounts-movements.service';
import { CreateLoanPaidDto, FilterLoanPaidDto } from './dto/loan-paid.schema';

const ROUNDING_ACCEPTANCE_TOLERANCE = 0.005;
const EPSILON_COMPARISON = 0.05;

@Injectable()
export class LoanPaidService implements OnModuleInit {
  private bankMovementsService: BankMovementsService;

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly generateCodeService: GenerateCodeService,
    private readonly accountingEntriesService: AccountingEntriesService,
    private readonly eventEmitter: EventEmitter2,
    private readonly pdfService: PdfGeneratorService,
    private moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    this.bankMovementsService = this.moduleRef.get(BankMovementsService, {
      strict: false,
    });
  }

  private async generatePaymentAccountingEntry(
    tenantId: string,
    userId: string,
    loanData: {
      id: string;
      associateId: string;
      currencyCode: string | null;
      associateFullname: string | null;
    },
    paymentAmount: number,
    principalAmount: number,
    interestAmount: number,
    paymentDate: Date,
    tx: NodePgDatabase<typeof schema>,
  ) {
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
          `El sistema está configurado para asientos automáticos, pero no existe una regla contable creada para procesar el pago del préstamo. Por favor, contacte al administrador.`,
        );
      }
      throw error;
    }
  }

  private async generatePaymentReversalAccountingEntry(
    tenantId: string,
    userId: string,
    loanData: {
      id: string;
      associateId: string;
      currencyCode: string | null;
      associateFullname: string | null;
    },
    paymentAmount: number,
    principalAmount: number,
    interestAmount: number,
    tx: NodePgDatabase<typeof schema>,
    paymentRef: string,
  ) {
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
          `Error en reversa contable: No existe una regla para procesar la anulación.`,
        );
      }
      throw error;
    }
  }

  private async _calculateBalancePending(loanId: string): Promise<number> {
    const loanAmortization = await this.db
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

  private async _calculateCoveredInstallments(
    loanId: string,
    amount: number,
  ): Promise<{
    paidInstallmentDetails: {
      id: string;
      amount: number;
      principal: number;
      interest: number;
    }[];
    partialInstallment?: {
      id: string;
      paidAmount: number;
      originalPaidAmount: number;
      principal: number;
      interest: number;
    };
    remainingAmount: number;
  }> {
    const pendingInstallments =
      await this.db.query.loanAmortizationSchedule.findMany({
        where: and(
          eq(loanAmortizationSchedule.loanId, loanId),
          inArray(loanAmortizationSchedule.paymentStatus, [
            'PENDING',
            'PARTIAL',
          ]),
        ),
        orderBy: loanAmortizationSchedule.installmentNumber,
      });

    const paidInstallmentDetails: {
      id: string;
      amount: number;
      principal: number;
      interest: number;
    }[] = [];
    let partialInstallment:
      | {
          id: string;
          paidAmount: number;
          originalPaidAmount: number;
          principal: number;
          interest: number;
        }
      | undefined;

    let remainingPaymentAmount = amount;

    for (const installment of pendingInstallments) {
      const installmentTotal = Number(installment.totalInstallmentAmount);
      const installmentPaid = Number(installment.paidAmount || 0);
      let dueAmountExact = installmentTotal - installmentPaid;

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

  async create(
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

    const [loan] = await db
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
      throw new NotFoundException(`The loan was not found.`);
    }

    if (
      loan.status !== LoanStatusEnum.DISBURSED &&
      loan.status !== LoanStatusEnum.IN_PAYMENT
    ) {
      throw new BadRequestException(
        `Payments cannot be made on loans with a status other than disbursed or in payment.`,
      );
    }

    const result = await this.db.transaction(async (tx) => {
      const { paidInstallmentDetails, partialInstallment, remainingAmount } =
        await this._calculateCoveredInstallments(loanId, amount);

      const currentBalanceCalculatedFromInstallments =
        await this._calculateBalancePending(loanId);

      const appliedAmountExact = amount - remainingAmount;

      let totalPrincipalPaid = 0;
      let totalInterestPaid = 0;

      let newBalancePending = Math.max(
        0,
        currentBalanceCalculatedFromInstallments - appliedAmountExact,
      );

      if (newBalancePending < EPSILON_COMPARISON) {
        newBalancePending = 0;
      }

      const customReference =
        await this.generateCodeService.generateNextReference(
          'PRE-PAG',
          tenantId,
          'loans',
          'payments',
        );

      const [insertedPayment] = await tx
        .insert(loanPayments)
        .values({
          tenantId,
          loanId: loanId,
          paymentDate: new Date(paymentDate),
          paymentType: paymentType || 'PAYING',
          amount: String(amount),
          balancePending: String(newBalancePending.toFixed(6)),
          bankId: bankId ?? undefined,
          paymentMethod: paymentMethod as paymentMethodEnum,
          transactionReference,
          comment,
          createdById: userId,
          customReference: customReference,
          status: 'DONE',
        })
        .returning({
          id: loanPayments.id,
          customReference: loanPayments.customReference,
        });

      for (const installment of paidInstallmentDetails) {
        totalPrincipalPaid += installment.principal;
        totalInterestPaid += installment.interest;

        await tx.insert(loanPaymentsDetails).values({
          loanPaymentId: insertedPayment.id,
          installmentId: installment.id,
          amount: String(installment.amount),
          createdById: userId,
        });

        await tx
          .update(loanAmortizationSchedule)
          .set({
            paymentStatus: 'PAID',
            updatedById: userId,
            paidAmount: sql`total_installment_amount`,
          })
          .where(eq(loanAmortizationSchedule.id, installment.id));
      }

      if (partialInstallment) {
        totalPrincipalPaid += partialInstallment.principal;
        totalInterestPaid += partialInstallment.interest;

        await tx
          .update(loanAmortizationSchedule)
          .set({
            paymentStatus: 'PARTIAL',
            paidAmount: String(partialInstallment.paidAmount),
            updatedById: userId,
          })
          .where(eq(loanAmortizationSchedule.id, partialInstallment.id));

        const amountAppliedToPartial =
          partialInstallment.paidAmount - partialInstallment.originalPaidAmount;

        await tx.insert(loanPaymentsDetails).values({
          loanPaymentId: insertedPayment.id,
          installmentId: partialInstallment.id,
          amount: String(amountAppliedToPartial.toFixed(6)),
          createdById: userId,
        });
      }

      let newLoanStatus: 'PAID' | 'IN_PAYMENT';
      let balanceInFavorValue = remainingAmount;

      if (newBalancePending <= 0) {
        newLoanStatus = 'PAID';
      } else {
        newLoanStatus = 'IN_PAYMENT';
      }

      await tx
        .update(loans)
        .set({
          status: newLoanStatus,
          balanceInFavor: String(balanceInFavorValue.toFixed(6)),
          updatedById: userId,
        })
        .where(and(eq(loans.id, loanId), eq(loans.tenantId, tenantId)));

      const paylodAuditData = {
        loanId: loanId,
        paymentDate,
        paymentType,
        amount: amount,
        balancePending: String(newBalancePending.toFixed(6)),
        bankId: bankId ?? undefined,
        paymentMethod,
        transactionReference,
        comment,
        createdBy: userId,
        customReference: insertedPayment.customReference,
      };

      if (!liquidationActive) {
        await this.generatePaymentAccountingEntry(
          tenantId,
          userId,
          loan,
          appliedAmountExact,
          totalPrincipalPaid,
          totalInterestPaid,
          paymentDate ? new Date(paymentDate) : new Date(),
          tx,
        );

        this.eventEmitter.emit(
          'audit.log',
          new AuditLogEvent({
            tableName: 'loan_payments',
            recordId: insertedPayment.id,
            action: 'INSERT',
            userId: userId,
            area: 'PRESTAMOS',
            description: `Pago de Préstamo registrado: ${loan.associateFullname} (Ref: ${insertedPayment.customReference})`,
            newData: [paylodAuditData],
          }),
        );
      }

      const resutAccount = await tx
        .select({ id: associateAccounts.id })
        .from(loans)
        .leftJoin(
          associateAccounts,
          eq(associateAccounts.associateId, loans.associateId),
        )
        .where(and(eq(loans.id, loanId), eq(loans.tenantId, tenantId)));

      const payloadMovementLoan = {
        associateAccountId: resutAccount[0]?.id,
        movementType: 'LOAN_PAYMENT_DEBIT' as AssociateMovementTypeEnum,
        amount: amount,
        currencyCode: 'VES' as CurrencyCodeEnum,
        transactionDate: paymentDate ? paymentDate : undefined,
        description: 'Pago Prestamo',
        referenceId: insertedPayment.id,
        referenceType: 'loansPayments',
        referenceNumber: insertedPayment.customReference ?? undefined,
        area: 'PRESTAMOS',
      };

      if (resutAccount[0]?.id) {
        await this.associateAccountsMovementsService.create(
          userId,
          payloadMovementLoan,
          tenantId,
          tx,
        );
      }

      if (bankId && !liquidationActive) {
        const dataBank = {
          movement: {
            bankAccountId: bankId,
            transactionDate: new Date(paymentDate) ?? new Date(),
            paymentMethod: paymentMethod as paymentMethodEnum,
            description: `Pago de Cuota Prestamo`,
            bankReference: transactionReference,
            category: 'LOAN_PAYMENT' as BankTransactionCategory,
            creditAmount: amount,
            debitAmount: 0,
            createdBy: userId,
          },
          links: [
            {
              internalRecordType: 'LOAN_PAYMENT',
              internalRecordId: String(resutAccount[0]?.id),
            },
          ],
        };
        await this.bankMovementsService.createAndReconcile(
          dataBank,
          userId,
          tenantId,
          tx,
        );
      }

      if (!liquidationActive) {
        if (balanceInFavorValue > EPSILON_COMPARISON) {
          const payloadMovementLoanFavor = {
            associateAccountId: resutAccount[0]?.id,
            movementType:
              'LOAN_OVERPAYMENT_CREDIT' as AssociateMovementTypeEnum,
            amount: balanceInFavorValue,
            currencyCode: 'VES' as CurrencyCodeEnum,
            transactionDate: paymentDate ? paymentDate : undefined,
            description: 'Credito Sobregiro de Prestamo',
            referenceId: loanId,
            referenceType: 'loans',
            referenceNumber: undefined,
            area: 'PRESTAMOS',
          };

          if (resutAccount[0]?.id) {
            await this.associateAccountsMovementsService.create(
              userId,
              payloadMovementLoanFavor,
              tenantId,
              tx,
            );
          }
        }
      }

      return {
        transation: true,
        insertedPaymentId: insertedPayment.id,
        customReference: insertedPayment.customReference,
        balanceInFavorValue: balanceInFavorValue,
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

  async downloadTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plantilla de Pagos');

    worksheet.columns = [
      { header: 'cedula', key: 'cedula', width: 20 },
      { header: 'monto', key: 'monto', width: 15 },
      { header: 'fecha', key: 'fecha', width: 18 },
    ];

    worksheet.getRow(1).font = { bold: true };

    worksheet.addRow({
      cedula: 'V-12345678',
      monto: 1500.5,
      fecha: format(new Date(), 'yyyy-MM-dd'),
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async bulkUpload(
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
    dto?: { paymentDate?: string },
  ) {
    if (!file) throw new BadRequestException('Archivo Excel no proporcionado');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.getWorksheet(1);
    const itemsFromExcel: { cedula: string; amount: number; fecha: string }[] =
      [];
    let finalPaymentDate;

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
          itemsFromExcel.push({
            cedula,
            amount,
            fecha: finalPaymentDate,
          });
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

    const result = await this.db.transaction(async (tx) => {
      let bulkTotalPrincipal = 0;
      let bulkTotalInterest = 0;
      let totalAmountApplied = 0;
      const accountingItemsForEntry: any[] = [];

      for (const item of itemsFromExcel) {
        try {
          const [associate] = await tx
            .select({ id: associates.id, fullname: associates.fullname })
            .from(associates)
            .where(
              and(
                eq(associates.cedula, item.cedula),
                eq(associates.tenantId, tenantId),
              ),
            );

          if (!associate) {
            results.errors.push({
              cedula: item.cedula,
              error: 'Asociado no encontrado',
            });
            continue;
          }

          const [loan] = await tx
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

          if (!loan) {
            results.errors.push({
              cedula: item.cedula,
              error: 'No se encontró préstamo activo',
            });
            continue;
          }

          const {
            paidInstallmentDetails,
            partialInstallment,
            remainingAmount,
          } = await this._calculateCoveredInstallments(loan.id, item.amount);

          const appliedAmountExact = item.amount - remainingAmount;
          if (appliedAmountExact <= 0) {
            results.errors.push({
              cedula: item.cedula,
              error: 'Monto insuficiente para abonar',
            });
            continue;
          }

          const currentBalance = await this._calculateBalancePending(loan.id);
          let newBalancePending = Math.max(
            0,
            currentBalance - appliedAmountExact,
          );
          if (newBalancePending < EPSILON_COMPARISON) newBalancePending = 0;

          const customReference =
            await this.generateCodeService.generateNextReference(
              'PRE-PAG',
              tenantId,
              'loans',
              'payments',
            );
          const [insertedPayment] = await tx
            .insert(loanPayments)
            .values({
              tenantId,
              loanId: loan.id,
              paymentDate: new Date(item.fecha),
              paymentType: 'PAYING' as loanPaymetTypeEnum,
              amount: String(item.amount),
              balancePending: String(newBalancePending.toFixed(6)),
              paymentMethod: 'BANK_TRANSFER' as paymentMethodEnum,
              transactionReference: customReference,
              comment: 'Carga Masiva Excel',
              createdById: userId,
              customReference,
              status: 'DONE',
            })
            .returning({
              id: loanPayments.id,
              customReference: loanPayments.customReference,
            });

          let localPrincipal = 0;
          let localInterest = 0;

          for (const inst of paidInstallmentDetails) {
            localPrincipal += inst.principal;
            localInterest += inst.interest;

            await tx.insert(loanPaymentsDetails).values({
              loanPaymentId: insertedPayment.id,
              installmentId: inst.id,
              amount: String(inst.amount),
              createdById: userId,
            });

            await tx
              .update(loanAmortizationSchedule)
              .set({
                paymentStatus: 'PAID',
                paidAmount: sql`total_installment_amount`,
                updatedById: userId,
              })
              .where(eq(loanAmortizationSchedule.id, inst.id));
          }

          if (partialInstallment) {
            localPrincipal += partialInstallment.principal;
            localInterest += partialInstallment.interest;

            await tx
              .update(loanAmortizationSchedule)
              .set({
                paymentStatus: 'PARTIAL',
                paidAmount: String(partialInstallment.paidAmount),
                updatedById: userId,
              })
              .where(eq(loanAmortizationSchedule.id, partialInstallment.id));

            await tx.insert(loanPaymentsDetails).values({
              loanPaymentId: insertedPayment.id,
              installmentId: partialInstallment.id,
              amount: String(
                (
                  partialInstallment.paidAmount -
                  partialInstallment.originalPaidAmount
                ).toFixed(6),
              ),
              createdById: userId,
            });
          }

          await tx
            .update(loans)
            .set({
              status: newBalancePending <= 0 ? 'PAID' : 'IN_PAYMENT',
              balanceInFavor: String(remainingAmount.toFixed(6)),
              updatedById: userId,
            })
            .where(and(eq(loans.id, loan.id), eq(loans.tenantId, tenantId)));

          const [acc] = await tx
            .select({ id: associateAccounts.id })
            .from(associateAccounts)
            .where(eq(associateAccounts.associateId, associate.id));

          if (acc) {
            await this.associateAccountsMovementsService.create(
              userId,
              {
                associateAccountId: acc.id,
                movementType: AssociateMovementTypeEnum.LOAN_PAYMENT_DEBIT,
                amount: item.amount,
                currencyCode: (loan.currencyCode ?? 'VES') as CurrencyCodeEnum,
                transactionDate: new Date(item.fecha),
                description: 'Pago Préstamo (Carga Masiva Excel)',
                referenceId: insertedPayment.id,
                referenceType: 'loansPayments',
              },
              tenantId,
              tx,
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
        } catch (err) {
          results.errors.push({
            cedula: item.cedula,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      if (results.totalProcessed > 0) {
        const roundedTotalPayment = Number(totalAmountApplied.toFixed(2));

        accountingItemsForEntry.push({
          associateId: 0,
          amounts: {
            BANK_ACCOUNT: roundedTotalPayment,
          },
          descriptions: {
            BANK_ACCOUNT: `Ingreso por Pagos de Préstamos (${results.totalProcessed} registros)`,
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
              description: `Carga Pagos de Préstamos - ${results.totalProcessed} registros`,
              entryDate: finalPaymentDate,
              currencyCode: CurrencyCodeEnum.VES,
              originType: 'LOAN_PAYMENT',
              items: accountingItemsForEntry,
            },
            tx,
          );
        } catch (error) {
          // accounting rule may not be configured
        }
      }

      return results;
    });

    return result;
  }

  async findAll(tenantId: string, dto: FilterLoanPaidDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      bank = '',
      type = '',
      method = '',
    } = dto || {};

    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [eq(loanPayments.tenantId, tenantId)];

    if (search) {
      conditions.push(ilike(loanPayments.customReference, `%${search}%`));
    }

    if (bank !== '') {
      conditions.push(eq(loanPayments.bankId, bank));
    }

    if (type !== '') {
      conditions.push(eq(loanPayments.paymentType, type as loanPaymetTypeEnum));
    }

    if (method) {
      conditions.push(
        eq(loanPayments.paymentMethod, method as paymentMethodEnum),
      );
    }

    const where = and(...conditions);

    const orderBy =
      sortOrder === 'asc'
        ? sql`${loanPayments[sortBy as keyof typeof loanPayments]} asc`
        : sql`${loanPayments[sortBy as keyof typeof loanPayments]} desc`;

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(loanPayments)
      .where(where);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select({
        id: loanPayments.id,
        customReference: loanPayments.customReference,
        paymentDate: loanPayments.paymentDate,
        paymentType: loanPayments.paymentType,
        paymentMethod: loanPayments.paymentMethod,
        bankName: bankDirectory.name,
        transactionReference: loanPayments.transactionReference,
        amount: loanPayments.amount,
        balancePending: loanPayments.balancePending,
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
        paymentStatus: loanPayments.status,
      })
      .from(loanPayments)
      .where(where)
      .leftJoin(bankDirectory, eq(bankDirectory.id, loanPayments.bankId))
      .leftJoin(
        loans,
        and(eq(loans.id, loanPayments.loanId), eq(loans.tenantId, tenantId)),
      )
      .leftJoin(associates, eq(associates.id, loans.associateId))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const trnasformData = data.map((item) => ({
      ...item,
      amount: Number(item.amount).toFixed(2),
      balancePending: Number(item.balancePending).toFixed(2),
    }));

    const meta = {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return {
      data: trnasformData,
      meta,
    };
  }

  async findOneRequest(cedula: string, tenantId: string) {
    const [associate] = await this.db
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
    if (associate.status === 'INACTIVE') {
      throw new NotFoundException(
        `Associate with cedula ${cedula} is inactive`,
      );
    }
    if (associate.status === 'RETIRED') {
      throw new NotFoundException(`Associate with cedula ${cedula} is retired`);
    }

    const result = await this.db
      .select({
        loanId: loans.id,
        loanType: loanTypes.name,
        loanTotalAmount: loans.totalPayable,
        loanModality: loans.loanModality,
        status: loans.status,
      })
      .from(loans)
      .where(
        and(
          eq(loans.tenantId, tenantId),
          eq(loans.associateId, associate.id),
          ne(loans.status, LoanStatusEnum.PAID),
          ne(loans.status, LoanStatusEnum.CANCELLED),
        ),
      )
      .leftJoin(loanTypes, eq(loans.loanTypeId, loanTypes.id))
      .leftJoin(
        loanAmortizationSchedule,
        eq(loans.id, loanAmortizationSchedule.loanId),
      );

    const loanAmortization = await this.db
      .select({
        id: loanAmortizationSchedule.id,
        quotaNumber: loanAmortizationSchedule.installmentNumber,
        quotaAmount: loanAmortizationSchedule.totalInstallmentAmount,
        quotaDate: loanAmortizationSchedule.dueDate,
        quotaStatus: loanAmortizationSchedule.paymentStatus,
        quotaPartial: loanAmortizationSchedule.paidAmount,
        principalBalancePending:
          loanAmortizationSchedule.principalBalancePending,
        paidAmount: loanAmortizationSchedule.paidAmount,
      })
      .from(loanAmortizationSchedule)
      .where(eq(loanAmortizationSchedule.loanId, result[0]?.loanId))
      .orderBy(sql<string>`
    CASE payment_status
      WHEN 'PARTIAL' THEN 1
      WHEN 'PENDING' THEN 2
      WHEN 'PAID' THEN 3
      ELSE 4
    END ASC,
    id ASC`);

    const pendingQuotas = loanAmortization.filter(
      (item) => item.quotaStatus === 'PENDING',
    );

    const partialQuotas = loanAmortization.filter(
      (item) => item.quotaStatus === 'PARTIAL',
    );

    const totalPending = pendingQuotas.reduce((acc, item) => {
      const amount = Number(item.quotaAmount) || 0;
      return acc + amount;
    }, 0);

    const totalPartial = partialQuotas.reduce((acc, item) => {
      const totalAmount = Number(item.quotaAmount) || 0;
      const paidAmount = Number(item.paidAmount) || 0;
      const remaining = totalAmount - paidAmount;
      return acc + (remaining > 0 ? remaining : 0);
    }, 0);
    const totalPendingAmount = totalPending + totalPartial;

    if (!associate) {
      throw new InternalServerErrorException(
        'No active associate found with the provided cedula.',
      );
    }

    const transformLoandAdmortization = loanAmortization.map((item) => ({
      ...item,
      principalBalancePending: Number(item.principalBalancePending).toFixed(2),
      quotaAmount: Number(item.quotaAmount).toFixed(2),
    }));

    return {
      id: associate.id,
      cedula: associate.cedula,
      fullname: associate.fullname,
      phone: associate.phone,
      email: associate.email,
      loanId: result.length === 0 ? null : result[0]?.loanId,
      loanType: result.length === 0 ? null : result[0]?.loanType,
      loanTotalAmount: String(totalPendingAmount.toFixed(2)),
      loanModality: result.length === 0 ? null : result[0]?.loanModality,
      loanAmortization: transformLoandAdmortization || null,
      loanStatus: result.length === 0 ? null : result[0]?.status,
    };
  }

  async remove(paymentId: string, tenantId: string, userId: string) {
    return await this.db.transaction(async (tx) => {
      const [payment] = await tx
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

      if (!payment?.loanId) {
        throw new InternalServerErrorException(
          'The payment does not have a valid loanId.',
        );
      }

      const paymetCount = await tx
        .select({ count: sql<number>`count(*)` })
        .from(loanPayments)
        .where(
          and(
            eq(loanPayments.tenantId, tenantId),
            eq(loanPayments.loanId, payment.loanId),
            eq(loanPayments.status, 'DONE'),
          ),
        );

      if (!payment) {
        throw new NotFoundException(`The payment was not found.`);
      }

      if (payment.statusPayment === 'CANCELED') {
        throw new BadRequestException(
          'This payment has already been cancelled.',
        );
      }

      const paymentDetails = await tx.query.loanPaymentsDetails.findMany({
        where: eq(loanPaymentsDetails.loanPaymentId, paymentId),
      });

      let totalPrincipalReverted = 0;
      let totalInterestReverted = 0;

      for (const detail of paymentDetails) {
        const installmentId = detail.installmentId;
        const amountToRevert = Number(detail.amount);

        if (installmentId == null) {
          throw new InternalServerErrorException(
            'installmentId is null or undefined.',
          );
        }

        await tx
          .update(loanPaymentsDetails)
          .set({ status: 'CANCELED' })
          .where(eq(loanPaymentsDetails.id, detail.id));

        const currentInstallment =
          await tx.query.loanAmortizationSchedule.findFirst({
            where: eq(loanAmortizationSchedule.id, installmentId),
          });

        if (currentInstallment) {
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

          totalPrincipalReverted += principalReverted;
          totalInterestReverted += interestReverted;

          const newPaidAmount = Math.max(
            0,
            Number(currentInstallment.paidAmount) - amountToRevert,
          );

          let newStatus: 'PENDING' | 'PARTIAL' = 'PENDING';
          if (newPaidAmount > 0) {
            newStatus = 'PARTIAL';
          }

          await tx
            .update(loanAmortizationSchedule)
            .set({
              paidAmount: String(newPaidAmount),
              paymentStatus: newStatus,
              updatedById: userId,
            })
            .where(eq(loanAmortizationSchedule.id, installmentId));
        }
      }

      let newStatusLoan;
      if (Number(paymetCount[0].count) === 1) {
        newStatusLoan = 'DISBURSED';
      } else {
        newStatusLoan = 'IN_PAYMENT';
      }
      await tx
        .update(loans)
        .set({
          status: newStatusLoan,
          updatedById: userId,
        })
        .where(eq(loans.id, payment.loanId));

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

      const associateAccount = await tx.query.associateAccounts.findFirst({
        where: eq(associateAccounts.associateId, payment.associateId ?? ''),
      });

      if (associateAccount) {
        await this.associateAccountsMovementsService.create(
          userId,
          {
            associateAccountId: associateAccount.id,
            movementType:
              'LOAN_PAYMENT_REVERSAL_CREDIT' as AssociateMovementTypeEnum,
            amount: Number(payment.amount),
            currencyCode: 'VES' as CurrencyCodeEnum,
            description: `REVERSO PAGO PRESTAMO - REF: ${payment.customReference}`,
            referenceId: payment.id,
            referenceType: 'loanPayments',
            area: 'PRESTAMOS',
          },
          tenantId,
          tx,
        );
      }

      await this.generatePaymentReversalAccountingEntry(
        tenantId,
        userId,
        {
          id: payment.loanId,
          associateId: payment.associateId ?? '',
          currencyCode: payment.currencyCode,
          associateFullname: payment.associateFullname,
        },
        Number(payment.amount),
        totalPrincipalReverted,
        totalInterestReverted,
        tx,
        payment.customReference ?? '',
      );

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'loan_payments',
          recordId: paymentId,
          action: 'CANCELED',
          userId: userId,
          area: 'PRESTAMOS',
          description: `Cancelación del pago ${payment.customReference}`,
          newData: [{ status: 'CANCELED' }],
        }),
      );

      return {
        message: `The payment ${payment.customReference} has been successfully cancelled.`,
      };
    });
  }

  async getReportsPdf(tenantId: string, dto?: FilterLoanPaidDto) {
    let rawData: any[];

    if (dto) {
      const payload = await this.findAll(tenantId, {
        ...dto,
        limit: dto.search ? 99999 : (dto.limit ?? 99999),
      });
      rawData = payload.data;
    } else {
      rawData = await this.db
        .select({
          id: loanPayments.id,
          customReference: loanPayments.customReference,
          paymentDate: loanPayments.paymentDate,
          paymentType: loanPayments.paymentType,
          paymentMethod: loanPayments.paymentMethod,
          bankName: bankDirectory.name,
          transactionReference: loanPayments.transactionReference,
          amount: loanPayments.amount,
          balancePending: loanPayments.balancePending,
          associateCedula: associates.cedula,
          associateFullname: associates.fullname,
          paymentStatus: loanPayments.status,
        })
        .from(loanPayments)
        .leftJoin(bankDirectory, eq(bankDirectory.id, loanPayments.bankId))
        .leftJoin(
          loans,
          and(eq(loans.id, loanPayments.loanId), eq(loans.tenantId, tenantId)),
        )
        .leftJoin(associates, eq(associates.id, loans.associateId))
        .where(eq(loanPayments.tenantId, tenantId))
        .orderBy(sql`${loanPayments.id} desc`)
        .limit(1000);
    }

    const paymentTypeMapper: Record<string, string> = {
      PAYING: 'Pago Cuota',
      CANCELLATION: 'Cancelación Pago',
    };

    const paymentStatusMapper: Record<string, string> = {
      DONE: 'Pagado',
      CANCELED: 'Anulado',
    };

    const tableBody = [
      ['Referencia', 'Fecha', 'Cédula', 'Asociado', 'Monto', 'Tipo', 'Estado'],
      ...rawData.map((item) => [
        item.customReference ?? 'N/A',
        item.paymentDate
          ? format(new Date(item.paymentDate), 'dd/MM/yyyy')
          : 'N/A',
        item.associateCedula ?? 'N/A',
        item.associateFullname ?? 'N/A',
        item.amount
          ? `${Number(item.amount).toLocaleString('es-VE', {
              minimumFractionDigits: 2,
            })}`
          : '0,00',
        item.paymentType
          ? paymentTypeMapper[item.paymentType] || item.paymentType
          : 'N/A',
        item.paymentStatus
          ? paymentStatusMapper[item.paymentStatus] || item.paymentStatus
          : 'N/A',
      ]),
    ];

    const content = {
      table: {
        headerRows: 1,
        widths: [80, 60, 60, '*', 70, 70, 60],
        body: tableBody,
      },
      layout: 'lightHorizontalLines',
    };

    return this.pdfService.generateReport(
      'LISTADO DE PAGOS DE PRÉSTAMOS',
      content,
      {
        orientation: 'landscape',
        pageSize: 'LETTER',
      },
    );
  }

  async applyPaymentFromBankReconciliation(
    paymentId: string,
    tx: NodePgDatabase<typeof schema>,
  ) {
    await tx
      .update(loanPayments)
      .set({ status: 'DONE' })
      .where(eq(loanPayments.id, paymentId));
  }
}
