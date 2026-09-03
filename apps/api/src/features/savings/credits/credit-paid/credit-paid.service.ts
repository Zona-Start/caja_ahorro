import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  associateAccounts,
  associates,
  creditAmortizationSchedule,
  creditPayments,
  creditPaymentsDetails,
  credits,
  creditsTypes,
} from '@/database/schema/tables/savings';
import { bankAccounts } from '@/database/schema/tables/treasury';
import { AuditHelper } from '@/features/audit/audit-event.service';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import {
  AssociateMovementTypeEnum,
  BankTransactionCategory,
  CreditStatusEnum,
  CurrencyCodeEnum,
  loanPaymetTypeEnum,
  paymentMethodEnum,
} from '@/types/enum';
import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { and, eq, ilike, inArray, ne, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { format } from 'date-fns';
import * as ExcelJS from 'exceljs';
import { AssociateAccountsMovementsService } from '../../parnerts/associate-accounts-movements/associate-accounts-movements.service';
import {
  CreateCreditPaidDto,
  FilterCreditPaidDto,
} from './dto/credit-paid.schema';

const ROUNDING_ACCEPTANCE_TOLERANCE = 0.005;
const EPSILON_COMPARISON = 0.05;

@Injectable()
export class CreditPaidService implements OnModuleInit {
  private bankMovementsService: BankMovementsService;
  private readonly logger = new Logger(CreditPaidService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly generateCodeService: GenerateCodeService,
    private readonly auditHelper: AuditHelper,
    private readonly accountingEntriesService: AccountingEntriesService,
    private moduleRef: ModuleRef,
  ) { }

  onModuleInit() {
    this.bankMovementsService = this.moduleRef.get(BankMovementsService, {
      strict: false,
    });
  }

  private async _calculateBalancePending(creditId: string): Promise<number> {
    const creditAmortization = await this.db
      .select({
        quotaAmount: creditAmortizationSchedule.totalInstallmentAmount,
        paidAmount: creditAmortizationSchedule.paidAmount,
        quotaStatus: creditAmortizationSchedule.paymentStatus,
      })
      .from(creditAmortizationSchedule)
      .where(eq(creditAmortizationSchedule.creditId, creditId))
      .orderBy(sql<string>`
      CASE payment_status
        WHEN 'PARTIAL' THEN 1
        WHEN 'PENDING' THEN 2
        WHEN 'PAID' THEN 3
        ELSE 4
      END ASC,
      id ASC`);

    const totalRemainingExact = creditAmortization.reduce((acc, item) => {
      const total = Number(item.quotaAmount);
      const paid = Number(item.paidAmount || 0);
      const remaining = total - paid;
      return acc + (remaining > EPSILON_COMPARISON ? remaining : 0);
    }, 0);

    return parseFloat(totalRemainingExact.toFixed(6));
  }

  private async _calculateCoveredInstallments(
    creditId: string,
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
      await this.db.query.creditAmortizationSchedule.findMany({
        where: and(
          eq(creditAmortizationSchedule.creditId, creditId),
          inArray(creditAmortizationSchedule.paymentStatus, [
            'PENDING',
            'PARTIAL',
          ]),
        ),
        orderBy: creditAmortizationSchedule.installmentNumber,
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
        const princInst = Number(installment.principalAmount);
        const intInst = Number(installment.interestAmount);
        const alreadyPaid = Number(installment.paidAmount || 0);

        const interestPaidBefore = Math.min(alreadyPaid, intInst);
        const interestStillDue = Math.max(0, intInst - interestPaidBefore);
        const principalPaidBefore = Math.max(0, alreadyPaid - intInst);
        const principalStillDue = Math.max(0, princInst - principalPaidBefore);

        paidInstallmentDetails.push({
          id: installment.id,
          amount: parseFloat(dueAmountExact.toFixed(6)),
          principal: parseFloat(principalStillDue.toFixed(6)),
          interest: parseFloat(interestStillDue.toFixed(6)),
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
            (installmentPaid + remainingPaymentAmount).toFixed(6),
          ),
          originalPaidAmount: installmentPaid,
          principal: parseFloat(newPrincipalPaid.toFixed(6)),
          interest: parseFloat(newInterestPaid.toFixed(6)),
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
    dto: CreateCreditPaidDto,
    tx?: NodePgDatabase<typeof schema>,
    liquidationActive?: boolean,
  ) {
    const {
      amount,
      bankId,
      creditId,
      paymentDate,
      paymentMethod,
      paymentType,
      comment,
      transactionReference,
    } = dto;

    const db = tx || this.db;

    const result = await db.transaction(async (tx) => {
      const { paidInstallmentDetails, partialInstallment, remainingAmount } =
        await this._calculateCoveredInstallments(creditId, amount);

      let totalPrincipalPaid = 0;
      let totalInterestPaid = 0;

      for (const installment of paidInstallmentDetails) {
        totalPrincipalPaid += installment.principal;
        totalInterestPaid += installment.interest;
      }

      if (partialInstallment) {
        totalPrincipalPaid += partialInstallment.principal;
        totalInterestPaid += partialInstallment.interest;
      }

      const currentBalanceCalculatedFromInstallments =
        await this._calculateBalancePending(creditId);

      const appliedAmountExact = amount - remainingAmount;

      let newBalancePending = Math.max(
        0,
        currentBalanceCalculatedFromInstallments - appliedAmountExact,
      );

      if (newBalancePending < EPSILON_COMPARISON) {
        newBalancePending = 0;
      }

      const customReference =
        await this.generateCodeService.generateNextReference(
          'CRE-PAG',
          tenantId,
          'portfolio',
          'credit-payments',
        );

      const [insertedPayment] = await tx
        .insert(creditPayments)
        .values({
          tenantId,
          creditId: creditId,
          paymentDate,
          paymentType,
          amount: String(amount),
          balancePending: String(newBalancePending.toFixed(6)),
          bankId: bankId ?? null,
          paymentMethod,
          transactionReference: transactionReference ?? null,
          comment: comment ?? null,
          createdById: userId,
          customReference: customReference,
        })
        .returning({
          id: creditPayments.id,
          customReference: creditPayments.customReference,
        });

      for (const installment of paidInstallmentDetails) {
        await tx.insert(creditPaymentsDetails).values({
          creditPaymentId: insertedPayment.id,
          installmentId: installment.id,
          amount: String(installment.amount),
          createdById: userId,
        });

        await tx
          .update(creditAmortizationSchedule)
          .set({
            paymentStatus: 'PAID',
            updatedById: userId,
            paidAmount: sql`total_installment_amount`,
          })
          .where(eq(creditAmortizationSchedule.id, installment.id));
      }

      if (partialInstallment) {
        await tx
          .update(creditAmortizationSchedule)
          .set({
            paymentStatus: 'PARTIAL',
            paidAmount: String(partialInstallment.paidAmount),
            updatedById: userId,
          })
          .where(eq(creditAmortizationSchedule.id, partialInstallment.id));

        const amountAppliedToPartial =
          partialInstallment.paidAmount - partialInstallment.originalPaidAmount;

        await tx.insert(creditPaymentsDetails).values({
          creditPaymentId: insertedPayment.id,
          installmentId: partialInstallment.id,
          amount: String(amountAppliedToPartial.toFixed(6)),
          createdById: userId,
        });
      }

      let newCreditStatus = 'APPROVED';
      const balanceInFavorValue = remainingAmount;

      if (newBalancePending <= 0) {
        newCreditStatus = 'PAID';
      } else {
        newCreditStatus = 'IN_PAYMENT';
      }

      await tx
        .update(credits)
        .set({
          status: newCreditStatus as CreditStatusEnum,
          balanceInFavor: String(balanceInFavorValue.toFixed(6)),
          updatedById: userId,
        })
        .where(eq(credits.id, creditId));

      await this.auditHelper.logCreate(
        userId,
        'credit_payment',
        insertedPayment,
        {
          tenantId,
          targetId: insertedPayment.id,
          description: `Pago de Crédito N°${customReference}`,
        },
      );

      return {
        transation: true,
        insertedPaymentId: insertedPayment.id,
        customReference: insertedPayment.customReference,
        balanceInFavorValue: balanceInFavorValue,
        appliedAmountExact,
        totalPrincipalPaid,
        totalInterestPaid,
      };
    });

    if (result.transation) {
      const resutAccount = await db
        .select({
          id: schema.associateAccounts.id,
          referenceLoans: credits.customReference,
          associateId: schema.credits.associateId,
          associateFullname: schema.associates.fullname,
          currencyCode: schema.credits.currencyCode,
        })
        .from(schema.credits)
        .leftJoin(
          schema.associateAccounts,
          eq(schema.associateAccounts.associateId, schema.credits.associateId),
        )
        .leftJoin(
          schema.associates,
          eq(schema.associates.id, schema.credits.associateId),
        )
        .where(
          and(
            eq(schema.credits.id, creditId),
            eq(schema.credits.tenantId, tenantId),
          ),
        );

      const payloadMovementLoan = {
        associateAccountId: resutAccount[0].id,
        movementType:
          'COMMERCIAL_CREDIT_PAYMENT_DEBIT' as AssociateMovementTypeEnum,
        amount: amount,
        currencyCode: 'VES' as CurrencyCodeEnum,
        transactionDate: paymentDate ? paymentDate : undefined,
        description: 'Pago Crédito',
        referenceId: String(result.insertedPaymentId),
        referenceType: 'creditPayments',
        referenceNumber: result.customReference ?? undefined,
        area: 'CREDITOS',
      };

      if (!liquidationActive && resutAccount[0].id) {
        await this.associateAccountsMovementsService.create(
          userId,
          payloadMovementLoan,
          tenantId,
        );
      }

      if (!liquidationActive && bankId) {
        const dataBank = {
          movement: {
            bankAccountId: bankId,
            transactionDate: paymentDate ?? new Date(),
            paymentMethod: paymentMethod as paymentMethodEnum,
            description: 'Pago de Cuota Crédito',
            bankReference: transactionReference,
            category: 'CREDIT_PAYMENT' as BankTransactionCategory,
            creditAmount: amount,
            debitAmount: 0,
            createdById: userId,
          },
          links: [
            {
              internalRecordType: 'CREDIT_PAYMENT',
              internalRecordId: String(resutAccount[0].id),
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
        if (result.balanceInFavorValue !== 0 && resutAccount[0]?.id) {
          const payloadMovementOverpayment = {
            associateAccountId: resutAccount[0].id,
            movementType:
              'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT' as AssociateMovementTypeEnum,
            amount: result.balanceInFavorValue,
            currencyCode: 'VES' as CurrencyCodeEnum,
            transactionDate: paymentDate ? paymentDate : undefined,
            description: 'CREDITO SOBREGIRO PAGO DE CREDITO',
            referenceId: String(creditId),
            referenceType: 'credits',
            referenceNumber: undefined,
            area: 'CREDITOS',
          };

          await this.associateAccountsMovementsService.create(
            userId,
            payloadMovementOverpayment,
            tenantId,
          );
        }
      }

      if (!liquidationActive) {
        let accountingWarning: string | undefined;
        let roundedPayment = 0;
        let roundedInterest = 0;
        let roundedPrincipal = 0;
        try {
          const dateStr = paymentDate
            ? format(new Date(paymentDate), 'dd/MM/yyyy')
            : format(new Date(), 'dd/MM/yyyy');
          const fullname = resutAccount[0]?.associateFullname ?? 'ASOCIADO';

          roundedPayment = Number(
            result.appliedAmountExact.toFixed(2),
          );
          roundedInterest = Number(
            result.totalInterestPaid.toFixed(2),
          );
          roundedPrincipal = Number(
            (roundedPayment - roundedInterest).toFixed(2),
          );
          const accountingPayload = {
            module: 'portfolio',
            submodule: 'credits',
            category: 'SAVINGS_BANK',
            operationType: 'CREDIT_PAYMENT',
            description: `Pago de Crédito - ${fullname}`,
            entryDate: paymentDate ? new Date(paymentDate) : new Date(),
            referenceValue: 'Pago Creditos',
            currencyCode:
              (resutAccount[0]?.currencyCode as CurrencyCodeEnum) ??
              CurrencyCodeEnum.VES,
            originReferenceId: String(result.insertedPaymentId),
            originType: 'CREDIT_PAYMENT',
            items: [
              {
                associateId: resutAccount[0]?.associateId,
                amounts: {
                  CREDIT_PAYMENT: roundedPrincipal,
                  LOAN_INTEREST_INCOME: roundedInterest,
                  LOAN_WITHHOLDING: roundedPayment,
                },
                descriptions: {
                  CREDIT_PAYMENT: `CUOTA CREDITO DEL ${dateStr}`,
                  LOAN_INTEREST_INCOME: `INTERES CREDITO DEL ${dateStr}`,
                  LOAN_WITHHOLDING: `RETENCIONES DE CREDITOS de ${dateStr}`,
                },
              },
            ],
            globalDescriptions: {
              CREDIT_PAYMENT: `CUOTA CREDITO DEL ${dateStr}`,
              LOAN_INTEREST_INCOME: `INTERES CREDITO DEL ${dateStr}`,
              LOAN_WITHHOLDING: `RETENCIONES DE CREDITOS de ${dateStr}`,
            },
          };

          this.logger.debug(
            `[create] Enviando asiento contable: paymentId=${result?.insertedPaymentId} amount=${amount} applied=${result?.appliedAmountExact} principal=${roundedPrincipal} interest=${roundedInterest} payment=${roundedPayment}`,
          );

          await this.accountingEntriesService.createAutomaticEntry(
            tenantId,
            userId,
            accountingPayload,
            tx,
          );
        } catch (error) {
          const errInfo = error as {
            message?: string;
            stack?: string;
            name?: string;
            response?: { data?: unknown; status?: number };
          };
          const message =
            errInfo?.message ??
            'Error al generar el asiento contable del pago de crédito';
          accountingWarning = message;
          this.logger.error(
            `[create] ERROR generando asiento contable del pago de crédito. ` +
            `creditId=${creditId} paymentId=${result?.insertedPaymentId} ` +
            `amount=${amount} applied=${result?.appliedAmountExact} ` +
            `principal=${roundedPrincipal} interest=${roundedInterest} ` +
            `payment=${roundedPayment}`,
          );
          this.logger.error(
            `[create] Detalle del error: name=${errInfo?.name} message=${message}\n` +
            `status=${errInfo?.response?.status} ` +
            `response=${JSON.stringify(errInfo?.response?.data ?? null)}\n` +
            `stack=${errInfo?.stack ?? '(sin stack)'}`,
          );
        }
      }
    }

    return {
      message: 'Credit paid create success',
    };
  }

  async downloadTemplate(): Promise<ArrayBuffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plantilla de Pagos de Créditos');

    worksheet.columns = [
      { key: 'a', width: 20 },
      { key: 'b', width: 18 },
    ];

    // Fila 1: fecha de pago (aplica a todos los pagos)
    worksheet.getCell('A1').value = 'fecha';
    worksheet.getCell('B1').value = format(new Date(), 'yyyy-MM-dd');
    worksheet.getCell('A1').font = { bold: true };
    worksheet.getCell('B1').font = { bold: true };

    // Fila 2: encabezados
    worksheet.getCell('A2').value = 'cedula';
    worksheet.getCell('B2').value = 'monto';
    worksheet.getRow(2).font = { bold: true };

    // Filas de ejemplo
    worksheet.getCell('A3').value = 'V-12345678';
    worksheet.getCell('B3').value = 1500.5;
    worksheet.getCell('A4').value = 'V-87654321';
    worksheet.getCell('B4').value = 2500;

    return workbook.xlsx.writeBuffer();
  }

  async bulkUpload(
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
    dto?: { paymentDate?: string },
  ) {
    if (!file) {
      throw new NotFoundException('Archivo Excel no proporcionado');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new NotFoundException(
        'No se encontró la hoja de trabajo en el Excel',
      );
    }

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
    const itemsFromExcel: { cedula: string; amount: number }[] = [];
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

    if (itemsFromExcel.length === 0) {
      throw new NotFoundException(
        'El archivo Excel está vacío o no tiene el formato correcto (Fila 1: fecha, Fila 2: cedula/monto, Fila 3+: datos)',
      );
    }

    const results = {
      success: [] as { cedula: string; ref: string | null }[],
      errors: [] as { cedula: string; error: string }[],
      totalProcessed: 0,
      accountingWarning: undefined as string | undefined,
    };

    const result = await this.db.transaction(async (tx) => {
      let bulkTotalPrincipal = 0;
      let bulkTotalInterest = 0;
      let totalAmountApplied = 0;
      const accountingItemsForEntry: {
        associateId?: string;
        amounts: Record<string, number>;
        descriptions: Record<string, string>;
      }[] = [];

      for (const item of itemsFromExcel) {
        try {
          const [associate] = await tx
            .select({
              id: associates.id,
              cedula: associates.cedula,
              fullname: associates.fullname,
            })
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

          const [credit] = await tx
            .select({
              id: credits.id,
              associateId: credits.associateId,
              currencyCode: credits.currencyCode,
            })
            .from(credits)
            .where(
              and(
                eq(credits.tenantId, tenantId),
                eq(credits.associateId, associate.id),
                ne(credits.status, CreditStatusEnum.PAID),
              ),
            );

          if (!credit) {
            results.errors.push({
              cedula: item.cedula,
              error: 'No se encontró crédito activo',
            });
            continue;
          }

          const installmentResult = await this._calculateCoveredInstallments(
            credit.id,
            item.amount,
          );

          const appliedAmountExact = item.amount - installmentResult.remainingAmount;

          if (appliedAmountExact <= 0) {
            results.errors.push({
              cedula: item.cedula,
              error: 'Monto insuficiente para abonar',
            });
            continue;
          }

          const currentBalance =
            await this._calculateBalancePending(credit.id);
          let newBalancePending = Math.max(
            0,
            currentBalance - appliedAmountExact,
          );
          if (newBalancePending < EPSILON_COMPARISON) newBalancePending = 0;

          const customReference =
            await this.generateCodeService.generateNextReference(
              'CRE-PAG',
              tenantId,
              'portfolio',
              'credit-payments',
            );

          const [insertedPayment] = await tx
            .insert(creditPayments)
            .values({
              tenantId,
              creditId: credit.id,
              paymentDate: finalPaymentDate,
              paymentType: 'PAYING',
              amount: String(item.amount),
              balancePending: String(newBalancePending.toFixed(6)),
              bankId: null,
              paymentMethod: paymentMethodEnum.BANK_TRANSFER,
              transactionReference: customReference,
              comment: 'Carga Masiva Excel Pagos de Créditos',
              createdById: userId,
              customReference,
            })
            .returning({
              id: creditPayments.id,
              customReference: creditPayments.customReference,
            });

          let localPrincipal = 0;
          let localInterest = 0;

          for (const inst of installmentResult.paidInstallmentDetails) {
            localPrincipal += inst.principal;
            localInterest += inst.interest;
            await tx.insert(creditPaymentsDetails).values({
              creditPaymentId: insertedPayment.id,
              installmentId: inst.id,
              amount: String(inst.amount),
              createdById: userId,
            });
            await tx
              .update(creditAmortizationSchedule)
              .set({
                paymentStatus: 'PAID',
                updatedById: userId,
                paidAmount: sql`total_installment_amount`,
              })
              .where(eq(creditAmortizationSchedule.id, inst.id));
          }

          if (installmentResult.partialInstallment) {
            localPrincipal += installmentResult.partialInstallment.principal;
            localInterest += installmentResult.partialInstallment.interest;

            await tx
              .update(creditAmortizationSchedule)
              .set({
                paymentStatus: 'PARTIAL',
                paidAmount: String(
                  installmentResult.partialInstallment.paidAmount,
                ),
                updatedById: userId,
              })
              .where(
                eq(
                  creditAmortizationSchedule.id,
                  installmentResult.partialInstallment.id,
                ),
              );

            const amountAppliedToPartial =
              installmentResult.partialInstallment.paidAmount -
              installmentResult.partialInstallment.originalPaidAmount;

            await tx.insert(creditPaymentsDetails).values({
              creditPaymentId: insertedPayment.id,
              installmentId: installmentResult.partialInstallment.id,
              amount: String(amountAppliedToPartial.toFixed(6)),
              createdById: userId,
            });
          }

          const newCreditStatus =
            newBalancePending <= 0 ? 'PAID' : 'IN_PAYMENT';

          await tx
            .update(credits)
            .set({
              status: newCreditStatus as CreditStatusEnum,
              balanceInFavor: String(
                installmentResult.remainingAmount.toFixed(6),
              ),
              updatedById: userId,
            })
            .where(eq(credits.id, credit.id));

          const [associateAccount] = await tx
            .select({ id: associateAccounts.id })
            .from(associateAccounts)
            .leftJoin(
              associates,
              eq(associates.id, associateAccounts.associateId),
            )
            .where(
              and(
                eq(associateAccounts.associateId, associate.id),
                eq(associateAccounts.status, 'ACTIVE'),
              ),
            );

          if (associateAccount?.id) {
            await this.associateAccountsMovementsService.create(
              userId,
              {
                associateAccountId: associateAccount.id,
                movementType:
                  'COMMERCIAL_CREDIT_PAYMENT_DEBIT' as AssociateMovementTypeEnum,
                amount: item.amount,
                currencyCode:
                  (credit.currencyCode as CurrencyCodeEnum) ??
                  CurrencyCodeEnum.VES,
                transactionDate: finalPaymentDate,
                description: 'Pago Crédito (Carga Masiva Excel)',
                referenceId: String(insertedPayment.id),
                referenceType: 'creditPayments',
                referenceNumber: insertedPayment.customReference ?? undefined,
                area: 'CREDITOS',
              },
              tenantId,
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
              CREDIT_PAYMENT: roundedPrincipal,
              LOAN_INTEREST_INCOME: roundedInterest,
            },
            descriptions: {
              CREDIT_PAYMENT: `CUOTA CREDITO DEL ${associate.fullname}`,
              LOAN_INTEREST_INCOME: `INTERES CREDITO DEL ${associate.fullname}`,
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

      // Asiento contable único para toda la carga masiva (no-fatal)
      if (results.totalProcessed > 0) {
        try {
          const dateStr = format(finalPaymentDate, 'dd/MM/yyyy');

          await this.accountingEntriesService.createAutomaticEntry(
            tenantId,
            userId,
            {
              module: 'portfolio',
              submodule: 'credits',
              category: 'SAVINGS_BANK',
              operationType: 'CREDIT_PAYMENT',
              description:
                `Carga Masiva Pagos de Créditos - ${results.totalProcessed} registros`,
              entryDate: finalPaymentDate,
              referenceValue: 'Pago Creditos',
              currencyCode: CurrencyCodeEnum.VES,
              originType: 'CREDIT_PAYMENT',
              items: [
                ...accountingItemsForEntry,
                {
                  associateId: undefined,
                  amounts: {
                    LOAN_WITHHOLDING: Number(totalAmountApplied.toFixed(2)),
                  },
                  descriptions: {
                    LOAN_WITHHOLDING: `RETENCIONES DE CREDITOS (${results.totalProcessed} registros)`,
                  },
                },
              ],
            },
            tx,
          );
        } catch (error) {
          const errInfo = error as { message?: string; stack?: string };
          this.logger.error(
            `[bulkUpload] Error generando asiento contable masivo: ${errInfo?.message ?? String(error)
            } ` +
            `processed=${results.totalProcessed} principal=${bulkTotalPrincipal} interest=${bulkTotalInterest} applied=${totalAmountApplied}`,
          );
          this.logger.error(
            `[bulkUpload] Detalle: stack=${errInfo?.stack ?? '(sin stack)'}`,
          );
          results.accountingWarning = errInfo?.message;
        }
      }

      return results;
    });

    return result;
  }

  async findAll(tenantId: string | null, paginationDto: FilterCreditPaidDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      bank = '',
      type = '',
      method = '',
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [];

    if (tenantId) {
      searchConditions.push(eq(creditPayments.tenantId, tenantId));
    }

    if (search) {
      searchConditions.push(
        ilike(creditPayments.customReference, `%${search}%`),
      );
    }

    if (bank !== '') {
      searchConditions.push(eq(creditPayments.bankId, bank));
    }

    if (type !== '') {
      searchConditions.push(
        eq(creditPayments.paymentType, type as loanPaymetTypeEnum),
      );
    }

    if (method) {
      searchConditions.push(
        eq(creditPayments.paymentMethod, method as paymentMethodEnum),
      );
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderByColumn = creditPayments[sortBy as keyof typeof creditPayments];
    const orderBy =
      sortOrder === 'asc'
        ? sql`${orderByColumn} asc`
        : sql`${orderByColumn} desc`;

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(creditPayments)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select({
        id: creditPayments.id,
        creditId: creditPayments.creditId,
        customReference: creditPayments.customReference,
        paymentDate: creditPayments.paymentDate,
        paymentType: creditPayments.paymentType,
        paymentMethod: creditPayments.paymentMethod,
        bankId: creditPayments.bankId,
        bankAccountName: bankAccounts.accountName,
        bankAccountNumber: bankAccounts.accountNumber,
        transactionReference: creditPayments.transactionReference,
        amount: creditPayments.amount,
        balancePending: creditPayments.balancePending,
        comment: creditPayments.comment,
        status: creditPayments.status,
        creditCustomReference: credits.customReference,
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
      })
      .from(creditPayments)
      .where(searchCondition)
      .leftJoin(bankAccounts, eq(bankAccounts.id, creditPayments.bankId))
      .leftJoin(credits, eq(credits.id, creditPayments.creditId))
      .leftJoin(associates, eq(associates.id, credits.associateId))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const meta = {
      totalItems: totalCount,
      itemCount: data.length,
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
    };

    return {
      data: data.map((item) => ({
        ...item,
        amount: Number(item.amount).toFixed(2),
      })),
      meta,
    };
  }

  async findOneRequest(tenantId: string | null, cedula: string) {
    const associateConditions: SQL<unknown>[] = [eq(associates.cedula, cedula)];
    if (tenantId) {
      associateConditions.push(eq(associates.tenantId, tenantId));
    }

    const associate = await this.db
      .select({
        id: associates.id,
        cedula: associates.cedula,
        fullname: associates.fullname,
        phone: associates.phone,
        email: associates.email,
        status: associates.status,
        accountNumber: associateAccounts.accountNumber,
        balance: associateAccounts.balance,
      })
      .from(associates)
      .leftJoin(
        associateAccounts,
        and(
          eq(associateAccounts.associateId, associates.id),
          eq(associateAccounts.status, 'ACTIVE'),
        ),
      )
      .where(and(...associateConditions));

    if (!associate.length) {
      throw new NotFoundException(`Associate with cedula ${cedula} not found`);
    }
    if (associate[0].status === 'INACTIVE') {
      throw new NotFoundException(
        `Associate with cedula ${cedula} is inactive`,
      );
    }
    if (associate[0].status === 'RETIRED') {
      throw new NotFoundException(`Associate with cedula ${cedula} is retired`);
    }

    const creditConditions: SQL<unknown>[] = [
      eq(credits.associateId, associate[0].id),
      ne(credits.status, CreditStatusEnum.PAID),
    ];
    if (tenantId) {
      creditConditions.push(eq(credits.tenantId, tenantId));
    }

    const result = await this.db
      .select({
        creditId: credits.id,
        creditType: creditsTypes.name,
        creditTotalAmount: credits.totalPayable,
        creditModality: credits.creditModality,
        creditCustomReference: credits.customReference,
        creditRequestedAmount: credits.requestedAmount,
      })
      .from(credits)
      .where(and(...creditConditions))
      .leftJoin(creditsTypes, eq(credits.creditTypeId, creditsTypes.id))
      .leftJoin(
        creditAmortizationSchedule,
        eq(credits.id, creditAmortizationSchedule.creditId),
      );

    const creditAmortization = result[0]?.creditId
      ? await this.db
        .select({
          id: creditAmortizationSchedule.id,
          quotaNumber: creditAmortizationSchedule.installmentNumber,
          quotaAmount: creditAmortizationSchedule.totalInstallmentAmount,
          quotaDate: creditAmortizationSchedule.dueDate,
          quotaStatus: creditAmortizationSchedule.paymentStatus,
          quotaPartial: creditAmortizationSchedule.paidAmount,
          principalBalancePending:
            creditAmortizationSchedule.principalBalancePending,
          paidAmount: creditAmortizationSchedule.paidAmount,
        })
        .from(creditAmortizationSchedule)
        .where(eq(creditAmortizationSchedule.creditId, result[0].creditId))
        .orderBy(sql<string>`
    CASE payment_status
      WHEN 'PARTIAL' THEN 1
      WHEN 'PENDING' THEN 2
      WHEN 'PAID' THEN 3
      ELSE 4
    END ASC,
    id ASC`)
      : [];

    const pendingQuotas = creditAmortization.filter(
      (item) => item.quotaStatus === 'PENDING',
    );
    const partialQuotas = creditAmortization.filter(
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

    if (associate.length === 0) {
      throw new InternalServerErrorException(
        'No active associate found with the provided cedula.',
      );
    }

    const transformCreditAmortization = creditAmortization.map((item) => ({
      ...item,
      quotaAmount: Number(item.quotaAmount).toFixed(2),
      paidAmount: Number(item.paidAmount).toFixed(2),
    }));

    return {
      id: associate[0].id,
      cedula: associate[0].cedula,
      fullname: associate[0].fullname,
      phone: associate[0].phone,
      email: associate[0].email,
      accountNumber: associate[0].accountNumber || null,
      balance: associate[0].balance || null,
      creditId: result.length === 0 ? null : result[0]?.creditId,
      creditType: result.length === 0 ? null : result[0]?.creditType,
      creditTotalAmount: String(totalPendingAmount.toFixed(2)),
      creditModality: result.length === 0 ? null : result[0]?.creditModality,
      creditCustomReference:
        result.length === 0 ? null : result[0]?.creditCustomReference,
      creditRequestedAmount:
        result.length === 0 ? null : result[0]?.creditRequestedAmount,
      creditAmortization: transformCreditAmortization || null,
    };
  }

  async applyPaymentFromBankReconciliation(
    paymentId: string,
    tx: NodePgDatabase<typeof schema>,
  ) {
    await tx
      .update(creditPayments)
      .set({ status: 'DONE' })
      .where(eq(creditPayments.id, paymentId));
  }

  async findOne(tenantId: string | null, paymentId: string) {
    const conditions: SQL<unknown>[] = [eq(creditPayments.id, paymentId)];
    if (tenantId) {
      conditions.push(eq(creditPayments.tenantId, tenantId));
    }

    const [payment] = await this.db
      .select({
        id: creditPayments.id,
        customReference: creditPayments.customReference,
        creditId: creditPayments.creditId,
        paymentDate: creditPayments.paymentDate,
        paymentType: creditPayments.paymentType,
        paymentMethod: creditPayments.paymentMethod,
        bankId: creditPayments.bankId,
        bankAccountName: bankAccounts.accountName,
        bankAccountNumber: bankAccounts.accountNumber,
        transactionReference: creditPayments.transactionReference,
        amount: creditPayments.amount,
        balancePending: creditPayments.balancePending,
        comment: creditPayments.comment,
        status: creditPayments.status,
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
        creditCustomReference: credits.customReference,
      })
      .from(creditPayments)
      .where(and(...conditions))
      .leftJoin(bankAccounts, eq(bankAccounts.id, creditPayments.bankId))
      .leftJoin(credits, eq(credits.id, creditPayments.creditId))
      .leftJoin(associates, eq(associates.id, credits.associateId));

    if (!payment) {
      throw new NotFoundException(
        `Credit payment with id ${paymentId} not found`,
      );
    }

    const details = await this.db
      .select({
        id: creditPaymentsDetails.id,
        amount: creditPaymentsDetails.amount,
        installmentNumber: creditAmortizationSchedule.installmentNumber,
        dueDate: creditAmortizationSchedule.dueDate,
        totalInstallmentAmount:
          creditAmortizationSchedule.totalInstallmentAmount,
        principalAmount: creditAmortizationSchedule.principalAmount,
        interestAmount: creditAmortizationSchedule.interestAmount,
      })
      .from(creditPaymentsDetails)
      .leftJoin(
        creditAmortizationSchedule,
        eq(creditAmortizationSchedule.id, creditPaymentsDetails.installmentId),
      )
      .where(eq(creditPaymentsDetails.creditPaymentId, paymentId));

    return {
      ...payment,
      amount: Number(payment.amount).toFixed(2),
      details: details.map((d) => ({
        ...d,
        amount: Number(d.amount).toFixed(2),
      })),
    };
  }

  async remove(tenantId: string, userId: string, paymentId: string) {
    const [payment] = await this.db
      .select({
        id: creditPayments.id,
        status: creditPayments.status,
        creditId: creditPayments.creditId,
      })
      .from(creditPayments)
      .where(
        and(
          eq(creditPayments.id, paymentId),
          eq(creditPayments.tenantId, tenantId),
        ),
      );

    if (!payment) {
      throw new NotFoundException(
        `Credit payment with id ${paymentId} not found`,
      );
    }

    if (payment.status === 'CANCELED') {
      throw new ConflictException('Credit payment is already canceled');
    }

    await this.db.transaction(async (tx) => {
      const details = await tx
        .select({
          id: creditPaymentsDetails.id,
          installmentId: creditPaymentsDetails.installmentId,
          amount: creditPaymentsDetails.amount,
        })
        .from(creditPaymentsDetails)
        .where(eq(creditPaymentsDetails.creditPaymentId, paymentId));

      for (const detail of details) {
        const [installment] = await tx
          .select({
            totalAmount: creditAmortizationSchedule.totalInstallmentAmount,
            paidAmount: creditAmortizationSchedule.paidAmount,
          })
          .from(creditAmortizationSchedule)
          .where(eq(creditAmortizationSchedule.id, detail.installmentId!));

        if (installment) {
          const currentPaid = Number(installment.paidAmount || 0);
          const detailAmount = Number(detail.amount);
          const newPaidAmount = Math.max(0, currentPaid - detailAmount);
          const totalAmount = Number(installment.totalAmount || 0);

          let newStatus: 'PENDING' | 'PARTIAL' | 'PAID' = 'PENDING';
          if (newPaidAmount <= 0) {
            newStatus = 'PENDING';
          } else if (newPaidAmount >= totalAmount) {
            newStatus = 'PAID';
          } else {
            newStatus = 'PARTIAL';
          }

          await tx
            .update(creditAmortizationSchedule)
            .set({
              paymentStatus: newStatus,
              paidAmount: String(newPaidAmount.toFixed(6)),
              updatedById: userId,
            })
            .where(eq(creditAmortizationSchedule.id, detail.installmentId!));
        }
      }

      await tx
        .update(creditPayments)
        .set({
          status: 'CANCELED',
          updatedById: userId,
        })
        .where(eq(creditPayments.id, paymentId));

      const newBalancePending = await this._calculateBalancePending(
        payment.creditId,
      );
      const newCreditStatus = newBalancePending <= 0 ? 'PAID' : 'IN_PAYMENT';

      await tx
        .update(credits)
        .set({
          status: newCreditStatus as CreditStatusEnum,
          balanceInFavor: '0',
          updatedById: userId,
        })
        .where(eq(credits.id, payment.creditId));

      await this.auditHelper.logCreate(
        userId,
        'credit_payment',
        { id: paymentId, action: 'canceled' },
        {
          tenantId,
          targetId: paymentId,
          description: `Cancelación de Pago de Crédito N°${paymentId}`,
        },
      );
    });

    return { message: 'Credit payment canceled successfully' };
  }
}
