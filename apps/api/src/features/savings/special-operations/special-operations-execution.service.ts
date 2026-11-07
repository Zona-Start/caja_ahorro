import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  associateAccounts,
  associates,
  creditAmortizationSchedule,
  creditOutstandingBalance,
  creditPayments,
  creditPaymentsDetails,
  credits,
  loanAmortizationSchedule,
  loanOutstandingBalance,
  loanPayments,
  loanPaymentsDetails,
  loans,
  moduleSettings,
  specialOperationItems,
  specialOperations,
  withdrawalTypes,
  withdrawalsAssociates,
} from '@/database/schema';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import { SavingsLiquidationService } from '@/features/savings/settlement/liquidation.service';
import { SettlementAssociateService } from '@/features/savings/settlement/settlement-associate.service';
import {
  AssociateMovementTypeEnum,
  CurrencyCodeEnum,
} from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssociateAccountsMovementsService } from '../parnerts/associate-accounts-movements/associate-accounts-movements.service';
import {
  ExecuteSpecialOperationInput,
  SpecialOperationAccountConfigItem,
} from './dto/special-operations.schema';
import { SpecialOperationsAccountingService } from './special-operations-accounting.service';
import {
  buildCreditRole,
  buildLoanRole,
  buildWithdrawalRole,
} from './special-operations-roles';

type AccountingItem = {
  associateId: string;
  cedula: string;
  fullname: string;
  amounts: Record<string, number>;
  display: Record<string, number>;
};

type ExecutionResult = {
  amounts: Record<string, number>;
  display: Record<string, number>;
  totalAmount: number;
  liquidationId?: string;
  withdrawalId?: string;
  loanPaymentIds?: string[];
  creditPaymentIds?: string[];
};

@Injectable()
export class SpecialOperationsExecutionService {
  private readonly logger = new Logger(
    SpecialOperationsExecutionService.name,
  );

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
    private readonly settlementService: SettlementAssociateService,
    private readonly liquidationService: SavingsLiquidationService,
    private readonly movementsService: AssociateAccountsMovementsService,
    private readonly accountingService: SpecialOperationsAccountingService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    dto: ExecuteSpecialOperationInput,
  ) {
    return this.db.transaction(async (tx) => {
      await this.ensureSequenceSetting(tx, tenantId);

      const reference = await this.generateCodeService.generateNextReference(
        'OPE-ESP',
        tenantId,
        'savings',
        'special-operations',
        tx,
      );

      const [operation] = await tx
        .insert(specialOperations)
        .values({
          tenantId,
          reference,
          operationType: dto.operationType,
          operationDate: dto.operationDate.toISOString().split('T')[0],
          status: 'PROCESSING',
          totalAssociates: 0,
          totalAmount: '0',
          currencyCode: 'VES' as CurrencyCodeEnum,
          accountConfig: dto.accountConfig,
          notes: dto.notes,
          createdById: userId,
        })
        .returning();

      const accountingItems: AccountingItem[] = [];
      const seen = new Set<string>();
      const seenAssociateIds = new Set<string>();
      let totalAmount = 0;

      for (const row of dto.rows) {
        const duplicateKey = row.cedula
          .replace(/[^0-9a-zA-Z]/g, '')
          .toUpperCase();

        if (seen.has(duplicateKey)) {
          throw new BadRequestException(
            `La cédula ${row.cedula} está duplicada en la operación.`,
          );
        }
        seen.add(duplicateKey);

        const associate = await this.resolveAssociate(
          tx,
          tenantId,
          row.cedula,
        );

        if (!associate) {
          throw new NotFoundException(
            `No existe un asociado con la cédula ${row.cedula}.`,
          );
        }

        if (seenAssociateIds.has(associate.id)) {
          throw new BadRequestException(
            `El asociado ${associate.cedula} está duplicado en la operación.`,
          );
        }
        seenAssociateIds.add(associate.id);

        if (associate.status === 'INACTIVE') {
          throw new BadRequestException(
            `El asociado con cédula ${associate.cedula} está inactivo.`,
          );
        }

        if (associate.status === 'RETIRED') {
          throw new BadRequestException(
            `El asociado con cédula ${associate.cedula} está retirado.`,
          );
        }

        const rowDate = row.date ?? dto.operationDate;
        const result =
          dto.operationType === 'LIQUIDATION_VS_INCOME'
            ? await this.executeLiquidation(
                tx,
                tenantId,
                userId,
                associate,
                rowDate,
                dto.notes,
              )
            : await this.executeLoanWithdrawal(
                tx,
                tenantId,
                userId,
                associate,
                rowDate,
                reference,
              );

        accountingItems.push({
          associateId: associate.id,
          cedula: associate.cedula,
          fullname: associate.fullname,
          amounts: result.amounts,
          display: result.display,
        });

        totalAmount += result.totalAmount;

        await tx.insert(specialOperationItems).values({
          operationId: operation.id,
          associateId: associate.id,
          cedula: associate.cedula,
          fullname: associate.fullname,
          amounts: {
            roles: result.amounts,
            display: result.display,
            loanPaymentIds: result.loanPaymentIds ?? [],
            creditPaymentIds: result.creditPaymentIds ?? [],
          },
          status: 'PROCESSED',
          liquidationId: result.liquidationId ?? null,
          withdrawalId: result.withdrawalId ?? null,
          loanPaymentIds: result.loanPaymentIds ?? null,
          createdById: userId,
        });
      }

      this.validateAccountConfig(
        dto.accountConfig,
        accountingItems,
      );

      const entry = await this.accountingService.createConsolidatedEntry(
        tenantId,
        userId,
        {
          operationId: operation.id,
          operationType: dto.operationType,
          operationDate: dto.operationDate,
          reference,
          items: accountingItems,
          accountConfig: dto.accountConfig,
        },
        tx,
      );

      await tx
        .update(specialOperations)
        .set({
          status: 'COMPLETED',
          totalAssociates: accountingItems.length,
          totalAmount: totalAmount.toFixed(6),
          accountingEntryId: entry.id,
          updatedById: userId,
        })
        .where(eq(specialOperations.id, operation.id));

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          userId,
          action: 'INSERT',
          tableName: 'specialOperations',
          recordId: operation.id,
          description: `Operación Especial ${reference} - ${dto.operationType}`,
          area: 'Caja de Ahorro',
          newData: [
            {
              reference,
              operationType: dto.operationType,
              operationDate: dto.operationDate,
              totalAssociates: accountingItems.length,
              totalAmount,
              accountingEntryId: entry.id,
            },
          ],
          tenantId,
        }),
      );

      this.logger.log(
        `[Operación Especial ${reference}] ${accountingItems.length} asociados procesados. Asiento ${entry.voucherNo}.`,
      );

      return {
        message: 'Operación especial procesada exitosamente.',
        operationId: operation.id,
        reference,
        totalAssociates: accountingItems.length,
        totalAmount,
        accountingEntryId: entry.id,
        voucherNo: entry.voucherNo,
      };
    });
  }

  private async executeLiquidation(
    tx: NodePgDatabase<typeof schema>,
    tenantId: string,
    userId: string,
    associate: {
      id: string;
      cedula: string;
      fullname: string;
      status: string;
    },
    date: Date,
    notes?: string,
  ): Promise<ExecutionResult> {
    const created = await this.settlementService.create(
      tenantId,
      userId,
      {
        associateId: associate.id,
        date,
        notes,
        settlementType: 'COMPLETE',
      },
      { originType: 'SPECIAL_OPERATION', tx },
    );

    const approval = await this.settlementService.approve(
      tenantId,
      userId,
      created.liquidation.id,
      {
        skipAccountingEntry: true,
        returnAccountingData: true,
        tx,
        date,
      },
    );

    const accounting = approval.accountingData;
    if (!accounting) {
      throw new BadRequestException(
        `No se obtuvieron los datos contables de la liquidación del asociado ${associate.cedula}.`,
      );
    }

    const sum = (values: Array<{ amount: number }>) =>
      values.reduce((total, item) => total + Number(item.amount ?? 0), 0);

    const normalWithdrawals = sum(
      accounting.withdrawals.filter((item) => !item.overpayment),
    );
    const overpaymentWithdrawals = sum(
      accounting.withdrawals.filter((item) => item.overpayment),
    );
    const normalLoans = sum(
      accounting.loans.filter((item) => !item.overpayment),
    );
    const overpaymentLoans = sum(
      accounting.loans.filter((item) => item.overpayment),
    );
    const normalCredits = sum(
      accounting.credits.filter((item) => !item.overpayment),
    );
    const overpaymentCredits = sum(
      accounting.credits.filter((item) => item.overpayment),
    );

    const amounts: Record<string, number> = {
      HABERES_ASOCIADOS: accounting.haberes.haberes_contribution,
      HABERES_PATRONO: accounting.haberes.haberes_employer,
      HABERES_VOLUNTARIOS: accounting.haberes.haberes_voluntary,
      EXCEDENTES: accounting.haberes.surpluses,
      SALDO_A_FAVOR:
        overpaymentWithdrawals + overpaymentLoans + overpaymentCredits,
      MONTO_A_LIQUIDAR: accounting.netAmount,
    };

    for (const withdrawal of accounting.withdrawals) {
      if (withdrawal.overpayment) continue;
      const type = withdrawal.description?.trim() || 'RETIRO NO IDENTIFICADO';
      const role = buildWithdrawalRole(type);
      amounts[role] =
        (amounts[role] ?? 0) + Number(withdrawal.amount ?? 0);
    }

    for (const loan of accounting.loans) {
      if (loan.overpayment) continue;
      const type = loan.typeName?.trim() || 'PRESTAMO';
      const role = buildLoanRole(type);
      amounts[role] = (amounts[role] ?? 0) + Number(loan.amount ?? 0);
    }

    for (const credit of accounting.credits) {
      if (credit.overpayment) continue;
      const type = credit.typeName?.trim() || 'CREDITO';
      const role = buildCreditRole(type);
      amounts[role] = (amounts[role] ?? 0) + Number(credit.amount ?? 0);
    }

    return {
      amounts,
      display: {
        montoLiquidar: accounting.netAmount,
        haberes:
          Number(accounting.haberes.haberes_contribution ?? 0) +
          Number(accounting.haberes.haberes_employer ?? 0) +
          Number(accounting.haberes.haberes_voluntary ?? 0) +
          Number(accounting.haberes.surpluses ?? 0),
        retiros: normalWithdrawals,
        prestamos: normalLoans,
        creditos: normalCredits,
        saldoFavor: overpaymentWithdrawals + overpaymentLoans + overpaymentCredits,
      },
      totalAmount: Number(accounting.netAmount ?? 0),
      liquidationId: created.liquidation.id,
    };
  }

  private async executeLoanWithdrawal(
    tx: NodePgDatabase<typeof schema>,
    tenantId: string,
    userId: string,
    associate: {
      id: string;
      cedula: string;
      fullname: string;
      status: string;
    },
    date: Date,
    operationReference: string,
  ): Promise<ExecutionResult> {
    const liquidation =
      await this.liquidationService.calculateAssociateLiquidation(
        associate.cedula,
        tenantId,
      );

    const accountId = liquidation.associate_account_id;
    const haberesTotales = Number(liquidation.total_savings_balance ?? 0);
    const debtBreakdown =
      await this.liquidationService.getAssociateDebtBreakdown(
        associate.id,
        tenantId,
      );

    const capitalPrestamos = debtBreakdown.loans.reduce(
      (total, item) => total + Number(item.amount ?? 0),
      0,
    );
    const capitalCreditos = debtBreakdown.credits.reduce(
      (total, item) => total + Number(item.amount ?? 0),
      0,
    );
    const deudaTotal = capitalPrestamos + capitalCreditos;

    if (!accountId) {
      throw new BadRequestException(
        `El asociado ${associate.cedula} no tiene una cuenta de haberes en VES.`,
      );
    }

    if (deudaTotal <= 0) {
      throw new BadRequestException(
        `El asociado ${associate.cedula} no tiene préstamos ni créditos activos para cancelar.`,
      );
    }

    if (haberesTotales < deudaTotal) {
      throw new BadRequestException(
        `Los haberes totales del asociado ${associate.cedula} (${haberesTotales.toFixed(
          2,
        )} Bs) no alcanzan para pagar la deuda total (${deudaTotal.toFixed(
          2,
        )} Bs).`,
      );
    }

    const withdrawalType = await this.ensureSystemWithdrawalType(
      tx,
      tenantId,
      userId,
    );

    const referenceCode =
      await this.generateCodeService.generateNextReference(
        'RET-SOC',
        tenantId,
        'savings',
        'withdrawals',
        tx,
      );

    const [withdrawal] = await tx
      .insert(withdrawalsAssociates)
      .values({
        tenantId,
        associateAccountId: accountId,
        withdrawalTypeId: withdrawalType.id,
        withdrawalDate: date,
        requestedAmount: deudaTotal.toString(),
        administrativeFee: '0',
        disbursedAmount: deudaTotal.toString(),
        currencyCode: 'VES' as CurrencyCodeEnum,
        paymentMethod: 'OTHER',
        referenceCode,
        status: 'PROCESSED',
        originType: 'SPECIAL_OPERATION',
        createdById: userId,
      })
      .returning();

    await this.movementsService.create(
      userId,
      {
        associateAccountId: accountId,
        movementType: AssociateMovementTypeEnum.SAVING_WITHDRAWAL,
        amount: deudaTotal,
        currencyCode: CurrencyCodeEnum.VES,
        transactionDate: date,
        description: `Retiro Préstamo vs Haberes - Ref: ${referenceCode}`,
        referenceId: withdrawal.id,
        referenceType: 'withdrawalsAssociates',
        status: 'COMPLETED',
      },
      tenantId,
      tx,
    );

    const loanPaymentIds =
      capitalPrestamos > 0
        ? await this.payLoansFromSavings(tx, {
            tenantId,
            userId,
            associateId: associate.id,
            date,
            operationReference,
          })
        : [];

    const creditPaymentIds =
      capitalCreditos > 0
        ? await this.payCreditsFromSavings(tx, {
            tenantId,
            userId,
            associateId: associate.id,
            date,
            operationReference,
          })
        : [];

    const amounts: Record<string, number> = {
      RETIRO_HABERES: deudaTotal,
    };

    for (const item of debtBreakdown.loans) {
      const role = buildLoanRole(item.typeName);
      amounts[role] = (amounts[role] ?? 0) + item.amount;
    }

    for (const item of debtBreakdown.credits) {
      const role = buildCreditRole(item.typeName);
      amounts[role] = (amounts[role] ?? 0) + item.amount;
    }

    return {
      amounts,
      display: {
        haberesTotales,
        capitalPrestamos,
        capitalCreditos,
        deudaTotal,
        montoDescontar: deudaTotal,
        saldoRestante: Number((haberesTotales - deudaTotal).toFixed(2)),
      },
      totalAmount: deudaTotal,
      withdrawalId: withdrawal.id,
      loanPaymentIds,
      creditPaymentIds,
    };
  }

  private async payLoansFromSavings(
    tx: NodePgDatabase<typeof schema>,
    params: {
      tenantId: string;
      userId: string;
      associateId: string;
      date: Date;
      operationReference: string;
    },
  ) {
    const outstandingLoans = await tx
      .select({
        loanId: loanOutstandingBalance.loanId,
        outstandingTotal: loanOutstandingBalance.capitalPendiente,
      })
      .from(loanOutstandingBalance)
      .where(
        and(
          eq(loanOutstandingBalance.associateId, params.associateId),
          eq(loanOutstandingBalance.currencyCode, 'VES'),
        ),
      );

    const loanPaymentIds: string[] = [];

    for (const loan of outstandingLoans) {
      const loanBalance = Number(loan.outstandingTotal);
      if (loanBalance <= 0) continue;

      const pendingInstallments = await tx
        .select({
          id: loanAmortizationSchedule.id,
          principalAmount: loanAmortizationSchedule.principalAmount,
          interestAmount: loanAmortizationSchedule.interestAmount,
          paidAmount: loanAmortizationSchedule.paidAmount,
        })
        .from(loanAmortizationSchedule)
        .where(
          and(
            eq(loanAmortizationSchedule.loanId, loan.loanId),
            inArray(loanAmortizationSchedule.paymentStatus, [
              'PENDING',
              'PARTIAL',
            ]),
          ),
        )
        .orderBy(loanAmortizationSchedule.installmentNumber);

      const paymentRef =
        await this.generateCodeService.generateNextReference(
          'PRE-PAG',
          params.tenantId,
          'portfolio',
          'loan-payments',
          tx,
        );

      const [loanPayment] = await tx
        .insert(loanPayments)
        .values({
          tenantId: params.tenantId,
          loanId: loan.loanId,
          paymentDate: params.date,
          paymentType: 'PAYING',
          amount: String(loanBalance),
          balancePending: '0',
          bankId: null,
          paymentMethod: 'OTHER',
          status: 'DONE',
          comment: `Cancelación total por Operación Especial #${params.operationReference}`,
          customReference: paymentRef,
          createdById: params.userId,
        })
        .returning({ id: loanPayments.id });

      for (const installment of pendingInstallments) {
        const paid = Number(installment.paidAmount || 0);
        const principalPaid = Math.max(
          0,
          paid - Number(installment.interestAmount),
        );
        const installmentOwed = Math.max(
          0,
          Number(installment.principalAmount) - principalPaid,
        );

        await tx.insert(loanPaymentsDetails).values({
          loanPaymentId: loanPayment.id,
          installmentId: installment.id,
          amount: String(installmentOwed),
          status: 'DONE',
          createdById: params.userId,
        });

        await tx
          .update(loanAmortizationSchedule)
          .set({
            paymentStatus: 'PAID',
            paidAmount: sql`total_installment_amount`,
            updatedById: params.userId,
          })
          .where(eq(loanAmortizationSchedule.id, installment.id));
      }

      await tx
        .update(loans)
        .set({
          status: 'PAID',
          updatedById: params.userId,
        })
        .where(eq(loans.id, loan.loanId));

      loanPaymentIds.push(loanPayment.id);
    }

    if (!loanPaymentIds.length) {
      throw new BadRequestException(
        'No se encontraron préstamos activos para cancelar.',
      );
    }

    return loanPaymentIds;
  }

  private async payCreditsFromSavings(
    tx: NodePgDatabase<typeof schema>,
    params: {
      tenantId: string;
      userId: string;
      associateId: string;
      date: Date;
      operationReference: string;
    },
  ) {
    const outstandingCredits = await tx
      .select({
        creditId: creditOutstandingBalance.creditId,
        outstandingTotal: creditOutstandingBalance.capitalPendiente,
      })
      .from(creditOutstandingBalance)
      .where(
        and(
          eq(creditOutstandingBalance.associateId, params.associateId),
          eq(creditOutstandingBalance.currencyCode, 'VES'),
        ),
      );

    const creditPaymentIds: string[] = [];

    for (const credit of outstandingCredits) {
      const creditBalance = Number(credit.outstandingTotal);
      if (creditBalance <= 0) continue;

      const pendingInstallments = await tx
        .select({
          id: creditAmortizationSchedule.id,
          principalAmount: creditAmortizationSchedule.principalAmount,
          interestAmount: creditAmortizationSchedule.interestAmount,
          paidAmount: creditAmortizationSchedule.paidAmount,
        })
        .from(creditAmortizationSchedule)
        .where(
          and(
            eq(creditAmortizationSchedule.creditId, credit.creditId),
            inArray(creditAmortizationSchedule.paymentStatus, [
              'PENDING',
              'PARTIAL',
            ]),
          ),
        )
        .orderBy(creditAmortizationSchedule.installmentNumber);

      const paymentRef =
        await this.generateCodeService.generateNextReference(
          'CRE-PAG',
          params.tenantId,
          'portfolio',
          'credit-payments',
          tx,
        );

      const [creditPayment] = await tx
        .insert(creditPayments)
        .values({
          tenantId: params.tenantId,
          creditId: credit.creditId,
          paymentDate: params.date,
          paymentType: 'PAYING',
          amount: String(creditBalance),
          balancePending: '0',
          bankId: null,
          paymentMethod: 'OTHER',
          status: 'DONE',
          comment: `Cancelación total por Operación Especial #${params.operationReference}`,
          customReference: paymentRef,
          createdById: params.userId,
        })
        .returning({ id: creditPayments.id });

      for (const installment of pendingInstallments) {
        const paid = Number(installment.paidAmount || 0);
        const principalPaid = Math.max(
          0,
          paid - Number(installment.interestAmount),
        );
        const installmentOwed = Math.max(
          0,
          Number(installment.principalAmount) - principalPaid,
        );

        await tx.insert(creditPaymentsDetails).values({
          creditPaymentId: creditPayment.id,
          installmentId: installment.id,
          amount: String(installmentOwed),
          createdById: params.userId,
        });

        await tx
          .update(creditAmortizationSchedule)
          .set({
            paymentStatus: 'PAID',
            paidAmount: sql`total_installment_amount`,
            updatedById: params.userId,
          })
          .where(
            eq(creditAmortizationSchedule.id, installment.id),
          );
      }

      await tx
        .update(credits)
        .set({
          status: 'PAID',
          updatedById: params.userId,
        })
        .where(eq(credits.id, credit.creditId));

      creditPaymentIds.push(creditPayment.id);
    }

    return creditPaymentIds;
  }

  private async ensureSystemWithdrawalType(
    tx: NodePgDatabase<typeof schema>,
    tenantId: string,
    userId: string,
  ) {
    const description = 'Retiro Préstamo vs Haberes';

    // 1. Si ya existe el tipo con la descripción limpia en el tenant, usarlo.
    const [existingClean] = await tx
      .select()
      .from(withdrawalTypes)
      .where(
        and(
          eq(withdrawalTypes.tenantId, tenantId),
          eq(withdrawalTypes.description, description),
        ),
      )
      .limit(1);

    if (existingClean) {
      if (!existingClean.isSystem) {
        await tx
          .update(withdrawalTypes)
          .set({ isSystem: true, updatedById: userId })
          .where(eq(withdrawalTypes.id, existingClean.id));
      }
      return { ...existingClean, isSystem: true };
    }

    // 2. Si existe el tipo de sistema anterior (con sufijo del tenant),
    //    renombrarlo a la descripción limpia.
    const [existingSystemType] = await tx
      .select()
      .from(withdrawalTypes)
      .where(
        and(
          eq(withdrawalTypes.tenantId, tenantId),
          eq(withdrawalTypes.isSystem, true),
        ),
      )
      .limit(1);

    if (existingSystemType) {
      await tx
        .update(withdrawalTypes)
        .set({
          description,
          isSystem: true,
          updatedById: userId,
        })
        .where(eq(withdrawalTypes.id, existingSystemType.id));

      return {
        ...existingSystemType,
        description,
        isSystem: true,
      };
    }

    // 3. Crear el tipo de sistema con la descripción limpia.
    const [created] = await tx
      .insert(withdrawalTypes)
      .values({
        tenantId,
        description,
        withdrawalPercentage: '100',
        administrativeFeePercentage: '0',
        isHouseComercial: false,
        isInternalInventory: false,
        isSystem: true,
        createdById: userId,
      })
      .onConflictDoNothing()
      .returning();

    if (created) return created;

    // 4. Si hubo conflicto por concurrencia, recuperar el registro existente.
    const [existingAfterConflict] = await tx
      .select()
      .from(withdrawalTypes)
      .where(
        and(
          eq(withdrawalTypes.tenantId, tenantId),
          eq(withdrawalTypes.description, description),
        ),
      )
      .limit(1);

    if (!existingAfterConflict) {
      throw new BadRequestException(
        'No se pudo crear el tipo de retiro interno de la operación especial.',
      );
    }

    return existingAfterConflict;
  }

  private async ensureSequenceSetting(
    tx: NodePgDatabase<typeof schema>,
    tenantId: string,
  ) {
    const [existing] = await tx
      .select({ id: moduleSettings.id })
      .from(moduleSettings)
      .where(
        and(
          eq(moduleSettings.tenantId, tenantId),
          eq(moduleSettings.module, 'savings'),
          eq(moduleSettings.submodule, 'special-operations'),
          eq(moduleSettings.key, 'OPE-ESP'),
        ),
      )
      .limit(1);

    if (!existing) {
      await tx.insert(moduleSettings).values({
        tenantId,
        module: 'savings',
        submodule: 'special-operations',
        key: 'OPE-ESP',
        value: '0',
        description: 'Consecutivo Operaciones Especiales',
      });
    }
  }

  private async resolveAssociate(
    tx: NodePgDatabase<typeof schema>,
    tenantId: string,
    cedulaInput: string,
  ) {
    const digits = cedulaInput.replace(/\D/g, '');
    const variants = new Set<string>([
      cedulaInput.trim(),
      cedulaInput.replace(/[^0-9a-zA-Z]/g, '').toUpperCase(),
      digits,
      `V${digits}`,
      `V-${digits}`,
      `E${digits}`,
      `E-${digits}`,
    ]);

    const conditions = Array.from(variants)
      .filter(Boolean)
      .map((variant) => eq(associates.cedula, variant));

    const [associate] = await tx
      .select({
        id: associates.id,
        cedula: associates.cedula,
        fullname: associates.fullname,
        status: associates.status,
      })
      .from(associates)
      .where(
        and(
          eq(associates.tenantId, tenantId),
          or(...conditions),
        ),
      )
      .limit(1);

    return associate ?? null;
  }

  private validateAccountConfig(
    config: SpecialOperationAccountConfigItem[],
    items: AccountingItem[],
  ) {
    const configByRole = new Map(
      config
        .filter((item) => !!item.accountPlanId)
        .map((item) => [item.role, item]),
    );

    const requiredRoles = new Set<string>();
    for (const item of items) {
      for (const [role, amount] of Object.entries(item.amounts)) {
        if (Number(amount) !== 0) {
          requiredRoles.add(role);
        }
      }
    }

    const missingRoles = Array.from(requiredRoles).filter(
      (role) => !configByRole.has(role),
    );

    if (missingRoles.length > 0) {
      throw new BadRequestException(
        `Faltan cuentas contables para los siguientes roles: ${missingRoles.join(
          ', ',
        )}.`,
      );
    }
  }
}
