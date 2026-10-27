import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { computePendingBalance } from '@/common/utils/pending-balance';
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
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { AuditHelper } from '@/features/audit/audit-event.service';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import { ExchangeRateService } from '@/features/core/exchange-rate/exchange-rate.service';
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
import { format } from 'date-fns';
import { and, desc, eq, ilike, inArray, ne, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
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
    private readonly exchangeRateService: ExchangeRateService,
    private moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    this.bankMovementsService = this.moduleRef.get(BankMovementsService, {
      strict: false,
    });
  }

  private async _calculateBalancePending(
    creditId: string,
    db: NodePgDatabase<typeof schema> = this.db,
  ): Promise<number> {
    const creditAmortization = await db
      .select({
        principalAmount: creditAmortizationSchedule.principalAmount,
        interestAmount: creditAmortizationSchedule.interestAmount,
        paidAmount: creditAmortizationSchedule.paidAmount,
        paymentStatus: creditAmortizationSchedule.paymentStatus,
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

    return computePendingBalance(creditAmortization);
  }

  /**
   * Saldo pendiente de partida para un nuevo pago.
   *
   * Es el `balance_pending` del último pago registrado (saldo corriente, que ya
   * está cuadrado con el saldo contable, incluso en créditos migrados). Si el
   * crédito no tiene pagos, se calcula desde la tabla de amortización.
   */
  private async _getPendingBalanceBase(
    creditId: string,
    db: NodePgDatabase<typeof schema> = this.db,
  ): Promise<number> {
    const [lastPayment] = await db
      .select({ balancePending: creditPayments.balancePending })
      .from(creditPayments)
      .where(
        and(
          eq(creditPayments.creditId, creditId),
          eq(creditPayments.status, 'DONE'),
        ),
      )
      .orderBy(desc(creditPayments.paymentDate), desc(creditPayments.createdAt))
      .limit(1);

    if (lastPayment?.balancePending != null) {
      return Number(lastPayment.balancePending);
    }

    return this._calculateBalancePending(creditId, db);
  }

  private async _calculateCoveredInstallments(
    creditId: string,
    amount: number,
    db: NodePgDatabase<typeof schema> = this.db,
    pendingBalanceBase?: number,
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
      await db.query.creditAmortizationSchedule.findMany({
        where: and(
          eq(creditAmortizationSchedule.creditId, creditId),
          inArray(creditAmortizationSchedule.paymentStatus, [
            'PENDING',
            'PARTIAL',
          ]),
        ),
        orderBy: creditAmortizationSchedule.installmentNumber,
      });

    const pendingBase =
      pendingBalanceBase ?? (await this._getPendingBalanceBase(creditId, db));

    // Cierre: si el pago cubre el capital pendiente, se cierran todas las
    // cuotas restantes y se condona el interés no cobrado (no genera
    // movimientos ni asientos de interés adicionales).
    if (amount + EPSILON_COMPARISON >= pendingBase) {
      let totalInterestDue = 0;
      const closingDetails: {
        id: string;
        amount: number;
        principal: number;
        interest: number;
      }[] = [];

      for (const installment of pendingInstallments) {
        const installmentTotal = Number(installment.totalInstallmentAmount);
        const installmentPaid = Number(installment.paidAmount || 0);
        const dueAmountExact = installmentTotal - installmentPaid;
        if (dueAmountExact <= EPSILON_COMPARISON) continue;

        const princInst = Number(installment.principalAmount);
        const intInst = Number(installment.interestAmount);
        const interestPaidBefore = Math.min(installmentPaid, intInst);
        const interestStillDue = Math.max(0, intInst - interestPaidBefore);
        const principalPaidBefore = Math.max(0, installmentPaid - intInst);
        const principalStillDue = Math.max(0, princInst - principalPaidBefore);

        totalInterestDue += interestStillDue;

        closingDetails.push({
          id: installment.id,
          amount: parseFloat(dueAmountExact.toFixed(6)),
          principal: parseFloat(principalStillDue.toFixed(6)),
          interest: parseFloat(interestStillDue.toFixed(6)),
        });
      }

      if (closingDetails.length === 0) {
        return {
          paidInstallmentDetails: [],
          partialInstallment: undefined,
          remainingAmount: parseFloat(Math.max(0, amount).toFixed(6)),
        };
      }

      // El capital registrado cierra exactamente contra el saldo base.
      const principalSum = closingDetails.reduce(
        (sum, detail) => sum + detail.principal,
        0,
      );
      const principalDelta = parseFloat(
        (pendingBase - principalSum).toFixed(6),
      );
      const lastDetail = closingDetails[closingDetails.length - 1];
      lastDetail.principal = parseFloat(
        Math.max(0, lastDetail.principal + principalDelta).toFixed(6),
      );

      // Solo se registra como interés el excedente sobre el capital; el
      // interés no cobrado se condona.
      const interestToRecord = Math.min(
        Math.max(0, amount - pendingBase),
        totalInterestDue,
      );
      let interestToCondone = parseFloat(
        (totalInterestDue - interestToRecord).toFixed(6),
      );
      for (
        let i = closingDetails.length - 1;
        i >= 0 && interestToCondone > 0;
        i--
      ) {
        const reduce = Math.min(closingDetails[i].interest, interestToCondone);
        closingDetails[i].interest = parseFloat(
          (closingDetails[i].interest - reduce).toFixed(6),
        );
        interestToCondone = parseFloat((interestToCondone - reduce).toFixed(6));
      }

      for (const detail of closingDetails) {
        detail.amount = parseFloat(
          (detail.principal + detail.interest).toFixed(6),
        );
      }

      return {
        paidInstallmentDetails: closingDetails,
        partialInstallment: undefined,
        // Exceso = lo que supera el CAPITAL pendiente (el interés se condona).
        remainingAmount: parseFloat(
          Math.max(0, amount - pendingBase).toFixed(6),
        ),
      };
    }

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
      exchangeRate: dtoExchangeRate,
    } = dto;

    const db = tx || this.db;

    const result = await db.transaction(async (tx) => {
      const [lockedCredit] = await tx
        .select()
        .from(credits)
        .where(eq(credits.id, creditId))
        .for('update');

      if (!lockedCredit) {
        throw new NotFoundException('Credit not found');
      }

      // El monto del pago está en la moneda del crédito. Se calcula su
      // equivalente en Bs a la tasa del día de pago (editable).
      const rateCurrency = (lockedCredit.currencyCode ??
        'VES') as CurrencyCodeEnum;
      let paymentRate =
        rateCurrency === 'VES' ? 1 : Number(dtoExchangeRate ?? 0);
      if (
        rateCurrency !== 'VES' &&
        (!Number.isFinite(paymentRate) || paymentRate <= 0)
      ) {
        paymentRate = await this.exchangeRateService.getRate(
          tenantId,
          paymentDate,
          rateCurrency as CurrencyCodeEnum,
        );
      }
      const paymentAmountBase = +(amount * paymentRate).toFixed(4);

      const pendingBalanceBase = await this._getPendingBalanceBase(
        creditId,
        tx,
      );

      const { paidInstallmentDetails, partialInstallment, remainingAmount } =
        await this._calculateCoveredInstallments(
          creditId,
          amount,
          tx,
          pendingBalanceBase,
        );

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

      const appliedAmountExact = amount - remainingAmount;

      let newBalancePending = Math.max(
        0,
        pendingBalanceBase - totalPrincipalPaid,
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
          currencyCode: lockedCredit.currencyCode ?? 'VES',
          exchangeRate: String(paymentRate),
          amountBase: String(paymentAmountBase),
          amountForeign: String(amount),
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
          .where(
            and(
              eq(creditAmortizationSchedule.id, installment.id),
              ne(creditAmortizationSchedule.paymentStatus, 'PAID'),
            ),
          );
      }

      if (partialInstallment) {
        const amountAppliedToPartial =
          partialInstallment.paidAmount - partialInstallment.originalPaidAmount;

        await tx
          .update(creditAmortizationSchedule)
          .set({
            paymentStatus: 'PARTIAL',
            paidAmount: sql`${creditAmortizationSchedule.paidAmount} + ${amountAppliedToPartial.toFixed(6)}`,
            updatedById: userId,
          })
          .where(eq(creditAmortizationSchedule.id, partialInstallment.id));

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
        totalInterestPaid,
        paymentRate,
        paymentAmountBase,
      };
    });

    if (result.transation) {
      const resutAccount = await db
        .select({
          id: schema.associateAccounts.id,
          referenceCredits: credits.customReference,
          associateId: schema.credits.associateId,
          associateFullname: schema.associates.fullname,
          currencyCode: schema.credits.currencyCode,
          creditType: schema.creditsTypes.name,
        })
        .from(schema.credits)
        .leftJoin(
          schema.associateAccounts,
          eq(schema.associateAccounts.associateId, schema.credits.associateId),
        )
        .leftJoin(
          schema.creditsTypes,
          eq(schema.creditsTypes.id, schema.credits.creditTypeId),
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

      const roundedPayment = Number(result.appliedAmountExact.toFixed(2));
      const roundedInterest = Number(result.totalInterestPaid.toFixed(2));

      // Pago en exceso: se condona el interés de todas las cuotas cubiertas y
      // todo el dinero va a la cuenta del crédito (capital).
      const hasExcess = result.balanceInFavorValue > 0;
      const effectiveInterest = hasExcess ? 0 : roundedInterest;
      const effectivePrincipal = Number(
        (roundedPayment - effectiveInterest).toFixed(2),
      );
      const paymentRate = result.paymentRate;
      const effectivePrincipalBs = +(effectivePrincipal * paymentRate).toFixed(
        2,
      );
      const effectiveInterestBs = +(effectiveInterest * paymentRate).toFixed(2);

      const payloadMovementCapital = {
        associateAccountId: resutAccount[0].id,
        movementType:
          'COMMERCIAL_CREDIT_PAYMENT_DEBIT' as AssociateMovementTypeEnum,
        amount: effectivePrincipalBs,
        currencyCode: 'VES' as CurrencyCodeEnum,
        transactionDate: paymentDate ? paymentDate : undefined,
        description: `Pago Cuota Capital Crédito Nº ${resutAccount[0].referenceCredits}`,
        referenceId: String(result.insertedPaymentId),
        referenceType: 'creditPayments',
        referenceNumber: result.customReference ?? undefined,
        area: 'CREDITOS',
      };

      const payloadMovementInterest = {
        associateAccountId: resutAccount[0].id,
        movementType:
          'COMMERCIAL_CREDIT_PAYMENT_DEBIT' as AssociateMovementTypeEnum,
        amount: effectiveInterestBs,
        currencyCode: 'VES' as CurrencyCodeEnum,
        transactionDate: paymentDate ? paymentDate : undefined,
        description: `Pago Cuota Interés Crédito Nº ${resutAccount[0].referenceCredits}`,
        referenceId: String(result.insertedPaymentId),
        referenceType: 'creditPayments',
        referenceNumber: result.customReference ?? undefined,
        area: 'CREDITOS',
      };

      if (!liquidationActive && resutAccount[0].id) {
        if (effectivePrincipal > 0) {
          await this.associateAccountsMovementsService.create(
            userId,
            payloadMovementCapital,
            tenantId,
          );
        }
        if (effectiveInterest > 0) {
          await this.associateAccountsMovementsService.create(
            userId,
            payloadMovementInterest,
            tenantId,
          );
        }
      }

      if (!liquidationActive && bankId) {
        const dataBank = {
          movement: {
            bankAccountId: bankId,
            transactionDate: paymentDate ?? new Date(),
            paymentMethod: paymentMethod as paymentMethodEnum,
            description: `Pago de Cuota Crédito Nº ${resutAccount[0].referenceCredits}`,
            bankReference: transactionReference,
            category: 'CREDIT_PAYMENT' as BankTransactionCategory,
            creditAmount: result.paymentAmountBase,
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
              'CREDIT_PAYMENT_REVERSAL_CREDIT' as AssociateMovementTypeEnum,
            amount: +(result.balanceInFavorValue * paymentRate).toFixed(2),
            currencyCode: 'VES' as CurrencyCodeEnum,
            transactionDate: paymentDate ? paymentDate : undefined,
            description:
              'Ajuste a favor por cobro en exceso por pago de credito Nº' +
              resutAccount[0].referenceCredits,
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
        try {
          const dateStr = paymentDate
            ? format(new Date(paymentDate), 'dd/MM/yyyy')
            : format(new Date(), 'dd/MM/yyyy');
          const fullname = resutAccount[0]?.associateFullname ?? 'ASOCIADO';

          const roundedTotal = Number(result.paymentAmountBase.toFixed(2));
          const accountingPrincipal = Number(
            (roundedTotal - effectiveInterestBs).toFixed(2),
          );

          const accountingPayload = {
            module: 'portfolio',
            submodule: 'credits',
            category: 'SAVINGS_BANK',
            operationType: 'CREDIT_PAYMENT_INDIVIDUAL',
            description: `Pago de Crédito - ${fullname}`,
            entryDate: paymentDate ? new Date(paymentDate) : new Date(),
            referenceValue: resutAccount[0]?.creditType ?? 'Pago Creditos',
            currencyCode: CurrencyCodeEnum.VES,
            originReferenceId: String(result.insertedPaymentId),
            originType: 'CREDIT_PAYMENT',
            items: [
              {
                associateId: resutAccount[0]?.associateId,
                amounts: {
                  CREDIT_PAYMENT: accountingPrincipal,
                  LOAN_INTEREST_INCOME: effectiveInterestBs,
                  BANK_ACCOUNT: roundedTotal,
                },
                descriptions: {
                  CREDIT_PAYMENT: `CUOTA CREDITO DEL ${dateStr}`,
                  LOAN_INTEREST_INCOME: `INTERES CREDITO DEL ${dateStr}`,
                  BANK_ACCOUNT: `PAGO CREDITO DEL ${dateStr}`,
                },
              },
            ],
            globalDescriptions: {
              CREDIT_PAYMENT: `CUOTA CREDITO DEL ${dateStr}`,
              LOAN_INTEREST_INCOME: `INTERES CREDITO DEL ${dateStr}`,
              BANK_ACCOUNT: `PAGO CREDITO DEL ${dateStr}`,
            },
          };

          this.logger.debug(
            `[create] Enviando asiento contable: paymentId=${result?.insertedPaymentId} amount=${amount} applied=${result?.appliedAmountExact} principal=${effectivePrincipal} interest=${effectiveInterest} payment=${roundedPayment} accountingPrincipal=${accountingPrincipal} accountingBank=${roundedTotal}`,
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
              `principal=${effectivePrincipal} interest=${effectiveInterest} ` +
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

    const dateStr = format(finalPaymentDate, 'dd/MM/yyyy');
    const bulkCreditTypes = new Set<string>();

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
              customReference: credits.customReference,
              currencyCode: credits.currencyCode,
            })
            .from(credits)
            .where(
              and(
                eq(credits.tenantId, tenantId),
                eq(credits.associateId, associate.id),
                ne(credits.status, CreditStatusEnum.PAID),
              ),
            )
            .for('update');

          if (!credit && item.amount > 0) {
            const [lastPaidCredit] = await tx
              .select({
                id: credits.id,
                associateId: credits.associateId,
                currencyCode: credits.currencyCode,
                customReference: credits.customReference,
                creditTypeName: creditsTypes.name,
              })
              .from(credits)
              .leftJoin(creditsTypes, eq(creditsTypes.id, credits.creditTypeId))
              .where(
                and(
                  eq(credits.tenantId, tenantId),
                  eq(credits.associateId, associate.id),
                  eq(credits.status, CreditStatusEnum.PAID),
                ),
              )
              .orderBy(desc(credits.startDate))
              .limit(1);

            if (lastPaidCredit) {
              bulkCreditTypes.add(
                lastPaidCredit.creditTypeName ?? 'CREDITOS COMERCIALES',
              );
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
                      'CREDIT_PAYMENT_REVERSAL_CREDIT' as AssociateMovementTypeEnum,
                    amount: item.amount,
                    currencyCode:
                      lastPaidCredit.currencyCode as CurrencyCodeEnum,
                    transactionDate: finalPaymentDate,
                    description:
                      'Ajuste a favor por cobro en exceso por pago de credito Nº' +
                      lastPaidCredit.customReference,
                    referenceId: lastPaidCredit.id,
                    referenceType: 'credits',
                    referenceNumber: undefined,
                    area: 'CREDITOS',
                  },
                  tenantId,
                );
              }

              const roundedPayment = Number(item.amount);
              const roundedInterest = Number(0);
              const roundedPrincipal = Number(
                (roundedPayment - roundedInterest).toFixed(2),
              );

              accountingItemsForEntry.push({
                associateId: associate.id,
                amounts: {
                  CREDIT_PAYMENT: item.amount,
                  LOAN_INTEREST_INCOME: 0,
                },
                descriptions: {
                  CREDIT_PAYMENT: `CUOTA CREDITO DEL ${dateStr}`,
                  LOAN_INTEREST_INCOME: `INTERES CREDITO DEL ${dateStr}`,
                },
              });

              bulkTotalPrincipal += roundedPrincipal;
              bulkTotalInterest += roundedInterest;
              totalAmountApplied += roundedPayment;

              results.success.push({
                cedula: item.cedula,
                ref: 'Asocido sin credito activo, Saldo cargado a favor como exceso',
              });
              results.totalProcessed++;
            } else {
              results.errors.push({
                cedula: item.cedula,
                error:
                  'Verificar Asociado no tiene ningun credito registrado del cual tenga alguna cuota en exceso,',
              });
              continue;
            }
          } else {
            const [creditTypeRow] = await tx
              .select({ name: creditsTypes.name })
              .from(credits)
              .leftJoin(creditsTypes, eq(creditsTypes.id, credits.creditTypeId))
              .where(eq(credits.id, credit.id));
            const creditTypeName = creditTypeRow?.name ?? 'CREDITOS';
            bulkCreditTypes.add(creditTypeName);

            const pendingBalanceBase = await this._getPendingBalanceBase(
              credit.id,
              tx,
            );

            const installmentResult = await this._calculateCoveredInstallments(
              credit.id,
              item.amount,
              tx,
              pendingBalanceBase,
            );

            const appliedAmountExact =
              item.amount - installmentResult.remainingAmount;

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

            let newBalancePending = Math.max(
              0,
              pendingBalanceBase - localPrincipal,
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

            for (const inst of installmentResult.paidInstallmentDetails) {
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
                .where(
                  and(
                    eq(creditAmortizationSchedule.id, inst.id),
                    ne(creditAmortizationSchedule.paymentStatus, 'PAID'),
                  ),
                );
            }

            if (installmentResult.partialInstallment) {
              const amountAppliedToPartial =
                installmentResult.partialInstallment.paidAmount -
                installmentResult.partialInstallment.originalPaidAmount;

              await tx
                .update(creditAmortizationSchedule)
                .set({
                  paymentStatus: 'PARTIAL',
                  paidAmount: sql`${creditAmortizationSchedule.paidAmount} + ${amountAppliedToPartial.toFixed(6)}`,
                  updatedById: userId,
                })
                .where(
                  eq(
                    creditAmortizationSchedule.id,
                    installmentResult.partialInstallment.id,
                  ),
                );

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

            const roundedPayment = Number(appliedAmountExact.toFixed(2));
            const roundedInterest = Number(localInterest.toFixed(2));

            // Pago en exceso: se condona el interés de todas las cuotas
            // cubiertas y todo el dinero va a la cuenta del crédito (capital).
            const hasExcess = installmentResult.remainingAmount > 0;
            const effectiveInterest = hasExcess ? 0 : roundedInterest;
            const effectivePrincipal = Number(
              (roundedPayment - effectiveInterest).toFixed(2),
            );

            if (associateAccount?.id) {
              if (effectivePrincipal > 0) {
                await this.associateAccountsMovementsService.create(
                  userId,
                  {
                    associateAccountId: associateAccount.id,
                    movementType:
                      'COMMERCIAL_CREDIT_PAYMENT_DEBIT' as AssociateMovementTypeEnum,
                    amount: effectivePrincipal,
                    currencyCode:
                      (credit.currencyCode as CurrencyCodeEnum) ??
                      CurrencyCodeEnum.VES,
                    transactionDate: finalPaymentDate,
                    description: `Pago Cuota Capital Crédito Nº ${credit.customReference}`,
                    referenceId: String(insertedPayment.id),
                    referenceType: 'creditPayments',
                    referenceNumber:
                      insertedPayment.customReference ?? undefined,
                    area: 'CREDITOS',
                  },
                  tenantId,
                );
              }
              if (effectiveInterest > 0) {
                await this.associateAccountsMovementsService.create(
                  userId,
                  {
                    associateAccountId: associateAccount.id,
                    movementType:
                      'COMMERCIAL_CREDIT_PAYMENT_DEBIT' as AssociateMovementTypeEnum,
                    amount: effectiveInterest,
                    currencyCode:
                      (credit.currencyCode as CurrencyCodeEnum) ??
                      CurrencyCodeEnum.VES,
                    transactionDate: finalPaymentDate,
                    description: `Pago Cuota Interés Crédito Nº ${credit.customReference}`,
                    referenceId: String(insertedPayment.id),
                    referenceType: 'creditPayments',
                    referenceNumber:
                      insertedPayment.customReference ?? undefined,
                    area: 'CREDITOS',
                  },
                  tenantId,
                );
              }
              if (hasExcess) {
                await this.associateAccountsMovementsService.create(
                  userId,
                  {
                    associateAccountId: associateAccount.id,
                    movementType:
                      'CREDIT_PAYMENT_REVERSAL_CREDIT' as AssociateMovementTypeEnum,
                    amount: installmentResult.remainingAmount,
                    currencyCode:
                      (credit.currencyCode as CurrencyCodeEnum) ??
                      CurrencyCodeEnum.VES,
                    transactionDate: finalPaymentDate,
                    description:
                      'Ajuste a favor por cobro en exceso por pago de credito Nº' +
                      credit.customReference,
                    referenceId: String(credit.id),
                    referenceType: 'credits',
                    referenceNumber: undefined,
                    area: 'CREDITOS',
                  },
                  tenantId,
                );
              }
            }

            accountingItemsForEntry.push({
              associateId: associate.id,
              amounts: hasExcess
                ? {
                    CREDIT_PAYMENT: item.amount,
                    LOAN_INTEREST_INCOME: 0,
                  }
                : {
                    CREDIT_PAYMENT: effectivePrincipal,
                    LOAN_INTEREST_INCOME: effectiveInterest,
                  },
              descriptions: {
                CREDIT_PAYMENT: `CUOTA CREDITO DEL ${dateStr}`,
                LOAN_INTEREST_INCOME: `INTERES CREDITO DEL ${dateStr}`,
              },
            });

            bulkTotalPrincipal += hasExcess ? item.amount : effectivePrincipal;
            bulkTotalInterest += effectiveInterest;
            totalAmountApplied += hasExcess ? item.amount : roundedPayment;

            results.success.push({
              cedula: item.cedula,
              ref: insertedPayment.customReference,
            });
            results.totalProcessed++;
          }
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
          const bulkCreditType =
            bulkCreditTypes.size > 0
              ? Array.from(bulkCreditTypes)[0]
              : 'CREDITOS';
          if (bulkCreditTypes.size > 1) {
            this.logger.warn(
              `[bulkUpload] Se detectaron múltiples tipos de crédito (${Array.from(
                bulkCreditTypes,
              ).join(
                ', ',
              )}). Se usará "${bulkCreditType}" como referencia contable.`,
            );
          }

          await this.accountingEntriesService.createAutomaticEntry(
            tenantId,
            userId,
            {
              module: 'portfolio',
              submodule: 'credits',
              category: 'SAVINGS_BANK',
              operationType: 'CREDIT_PAYMENT_MASSIVE',
              description: `Carga Masiva Pagos de Créditos - ${results.totalProcessed} registros`,
              entryDate: finalPaymentDate,
              referenceValue: bulkCreditType,
              currencyCode: CurrencyCodeEnum.VES,
              originType: 'CREDIT_PAYMENT',
              items: [
                ...accountingItemsForEntry,
                {
                  associateId: undefined,
                  amounts: {
                    CREDIT_WITHHOLDING: Number(totalAmountApplied.toFixed(2)),
                  },
                  descriptions: {
                    CREDIT_WITHHOLDING: `RETENCIONES DE CREDITO de ${dateStr}`,
                  },
                },
              ],
              globalDescriptions: {
                CREDIT_PAYMENT: `CUOTA CREDITO DEL ${dateStr}`,
                LOAN_INTEREST_INCOME: `INTERES CREDITO DEL ${dateStr}`,
                CREDIT_WITHHOLDING: `RETENCIONES DE CREDITO de ${dateStr}`,
              },
            },
            tx,
          );
        } catch (error) {
          const errInfo = error as { message?: string; stack?: string };
          this.logger.error(
            `[bulkUpload] Error generando asiento contable masivo: ${
              errInfo?.message ?? String(error)
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
      sortBy = 'createdAt',
      sortOrder = 'desc',
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
        currencyCode: creditPayments.currencyCode,
        exchangeRate: creditPayments.exchangeRate,
        amountBase: creditPayments.amountBase,
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
        amountBase: Number(item.amountBase ?? 0).toFixed(2),
        exchangeRate: item.exchangeRate
          ? Number(item.exchangeRate).toFixed(2)
          : null,
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
        creditCurrencyCode: credits.currencyCode,
        creditExchangeRate: credits.exchangeRate,
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
            principalAmount: creditAmortizationSchedule.principalAmount,
            interestAmount: creditAmortizationSchedule.interestAmount,
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

    const creditId = result.length === 0 ? null : result[0]?.creditId;

    // Saldo pendiente = saldo corriente (último pago) o capital pendiente del
    // schedule si no hay pagos. Igual que el detalle del inquiry y el contable.
    let pendingBalance = 0;
    if (creditId) {
      const [lastPayment] = await this.db
        .select({ balancePending: creditPayments.balancePending })
        .from(creditPayments)
        .where(
          and(
            eq(creditPayments.creditId, creditId),
            eq(creditPayments.status, 'DONE'),
          ),
        )
        .orderBy(
          desc(creditPayments.paymentDate),
          desc(creditPayments.createdAt),
        )
        .limit(1);

      pendingBalance =
        lastPayment?.balancePending != null
          ? Number(lastPayment.balancePending)
          : computePendingBalance(
              creditAmortization.map((i) => ({
                principalAmount: i.principalAmount,
                interestAmount: i.interestAmount,
                paidAmount: i.paidAmount,
                paymentStatus: i.quotaStatus,
              })),
            );
    }

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
      creditId,
      creditType: result.length === 0 ? null : result[0]?.creditType,
      creditTotalAmount: String(pendingBalance.toFixed(2)),
      creditModality: result.length === 0 ? null : result[0]?.creditModality,
      creditCustomReference:
        result.length === 0 ? null : result[0]?.creditCustomReference,
      creditRequestedAmount:
        result.length === 0 ? null : result[0]?.creditRequestedAmount,
      creditCurrencyCode:
        result.length === 0 ? null : result[0]?.creditCurrencyCode,
      creditExchangeRate:
        result.length === 0 ? null : result[0]?.creditExchangeRate,
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
        currencyCode: creditPayments.currencyCode,
        exchangeRate: creditPayments.exchangeRate,
        amountBase: creditPayments.amountBase,
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
        amount: creditPayments.amount,
        currencyCode: creditPayments.currencyCode,
        amountBase: creditPayments.amountBase,
        customReference: creditPayments.customReference,
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
      const [lockedPayment] = await tx
        .select()
        .from(creditPayments)
        .where(eq(creditPayments.id, paymentId))
        .for('update');

      if (!lockedPayment) {
        throw new NotFoundException('Credit payment not found');
      }
      if (lockedPayment.status === 'CANCELED') {
        throw new ConflictException('Credit payment is already canceled');
      }

      const [lockedCredit] = await tx
        .select()
        .from(credits)
        .where(eq(credits.id, lockedPayment.creditId))
        .for('update');

      if (!lockedCredit) {
        throw new NotFoundException('Credit not found');
      }

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
          .where(eq(creditAmortizationSchedule.id, detail.installmentId!))
          .for('update');

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
        lockedPayment.creditId,
        tx,
      );
      const newCreditStatus = newBalancePending <= 0 ? 'PAID' : 'IN_PAYMENT';

      await tx
        .update(credits)
        .set({
          status: newCreditStatus as CreditStatusEnum,
          balanceInFavor: '0',
          updatedById: userId,
        })
        .where(eq(credits.id, lockedPayment.creditId));

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

    // Reverso contable del pago individual (no-fatal)
    try {
      const [creditInfo] = await this.db
        .select({
          creditType: creditsTypes.name,
          associateId: credits.associateId,
          associateFullname: associates.fullname,
        })
        .from(credits)
        .leftJoin(creditsTypes, eq(creditsTypes.id, credits.creditTypeId))
        .leftJoin(associates, eq(associates.id, credits.associateId))
        .where(eq(credits.id, payment.creditId));

      const dateStr = format(new Date(), 'dd/MM/yyyy');
      // La contabilidad se lleva en Bs: los pagos en divisa usan su
      // equivalente congelado al momento del pago.
      const reversedAmount =
        payment.currencyCode === 'VES'
          ? Number(payment.amount)
          : Number(payment.amountBase);

      await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'portfolio',
          submodule: 'credits',
          category: 'SAVINGS_BANK',
          operationType: 'CREDIT_PAYMENT_INDIVIDUAL',
          description: `ANULACIÓN: Pago de Crédito - ${
            creditInfo?.associateFullname ?? 'ASOCIADO'
          } (Ref: ${payment.customReference ?? paymentId})`,
          entryDate: new Date(),
          referenceValue: creditInfo?.creditType ?? 'CREDITOS',
          currencyCode: CurrencyCodeEnum.VES,
          originReferenceId: String(paymentId),
          originType: 'CREDIT_PAYMENT_REVERSAL',
          items: [
            {
              associateId: creditInfo?.associateId,
              amounts: {
                CREDIT_PAYMENT: -reversedAmount,
                BANK_ACCOUNT: -reversedAmount,
              },
              descriptions: {
                CREDIT_PAYMENT: `REVERSA: CUOTA CREDITO DEL ${dateStr}`,
                BANK_ACCOUNT: `REVERSA: PAGO CREDITO DEL ${dateStr}`,
              },
            },
          ],
          globalDescriptions: {
            CREDIT_PAYMENT: `REVERSA: CUOTA CREDITO DEL ${dateStr}`,
            BANK_ACCOUNT: `REVERSA: PAGO CREDITO DEL ${dateStr}`,
          },
        },
      );
    } catch (error) {
      const errInfo = error as { message?: string; stack?: string };
      this.logger.error(
        `[remove] Error generando reverso contable del pago ${paymentId}: ${
          errInfo?.message ?? String(error)
        }`,
      );
      this.logger.error(
        `[remove] Detalle: stack=${errInfo?.stack ?? '(sin stack)'}`,
      );
    }

    return { message: 'Credit payment canceled successfully' };
  }
}
