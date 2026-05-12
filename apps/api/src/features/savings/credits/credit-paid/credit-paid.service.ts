import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  associates,
  creditAmortizationSchedule,
  creditPayments,
  creditPaymentsDetails,
  credits,
  creditsTypes,
} from '@/database/schema/tables/savings';
import { bankDirectory } from '@/database/schema/tables/treasury';
import { AuditHelper } from '@/features/audit/audit-event.service';
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
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { and, eq, ilike, inArray, ne, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
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

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly generateCodeService: GenerateCodeService,
    private readonly auditHelper: AuditHelper,
    private moduleRef: ModuleRef,
  ) {}

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
    paidInstallmentDetails: { id: string; amount: number }[];
    partialInstallment?: {
      id: string;
      paidAmount: number;
      originalPaidAmount: number;
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

    const paidInstallmentDetails: { id: string; amount: number }[] = [];
    let partialInstallment:
      | { id: string; paidAmount: number; originalPaidAmount: number }
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
        paidInstallmentDetails.push({
          id: installment.id,
          amount: parseFloat(dueAmountExact.toFixed(6)),
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
        partialInstallment = {
          id: installment.id,
          paidAmount: parseFloat(
            (installmentPaid + remainingPaymentAmount).toFixed(6),
          ),
          originalPaidAmount: installmentPaid,
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
          'credits',
          'payments',
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
      let balanceInFavorValue = remainingAmount;

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
      };
    });

    if (result.transation) {
      const resutAccount = await db
        .select({
          id: schema.associateAccounts.id,
          referenceLoans: credits.customReference,
        })
        .from(schema.credits)
        .leftJoin(
          schema.associateAccounts,
          eq(schema.associateAccounts.associateId, schema.credits.associateId),
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
    }

    return {
      message: 'Credit paid create success',
    };
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

    let searchConditions: SQL<unknown>[] = [];

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
        customReference: creditPayments.customReference,
        paymentDate: creditPayments.paymentDate,
        paymentType: creditPayments.paymentType,
        paymentMethod: creditPayments.paymentMethod,
        bankName: bankDirectory.name,
        transactionReference: creditPayments.transactionReference,
        amount: creditPayments.amount,
        balancePending: creditPayments.balancePending,
        associateCedula: associates.cedula,
        associatesFullname: associates.fullname,
      })
      .from(creditPayments)
      .where(searchCondition)
      .leftJoin(bankDirectory, eq(bankDirectory.id, creditPayments.bankId))
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
      })
      .from(associates)
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
      creditId: result.length === 0 ? null : result[0]?.creditId,
      creditType: result.length === 0 ? null : result[0]?.creditType,
      creditTotalAmount: String(totalPendingAmount.toFixed(2)),
      creditModality: result.length === 0 ? null : result[0]?.creditModality,
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
}
