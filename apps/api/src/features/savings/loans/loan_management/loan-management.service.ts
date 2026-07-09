import { PaginationDto } from '@/common/dto/pagination.dto';
import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  associateAccounts,
  associates,
  loans,
  loanAmortizationSchedule,
  loanStatusHistory,
  loanTypes,
} from '@/database/schema/tables/savings';
import { moduleSettings } from '@/database/schema/tables/core';
import { associateHaberesBalance } from '@/database/schema/views';
import { AssociateAccountsMovementsService } from '@/features/savings/parnerts/associate-accounts-movements/associate-accounts-movements.service';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import { AuditHelper } from '@/features/audit/audit-event.service';
import {
  AssociateMovementTypeEnum,
  BankTransactionCategory,
  CurrencyCodeEnum,
  loanModalityTypeEnum,
  LoanStatusEnum,
  paymentMethodEnum,
  PaymentStatusEnum,
} from '@/types/enum';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, count, desc, eq, ilike, ne, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  CreateLoanDto,
  DisburseLoanDto,
  FilterLoanDto,
  UpdateLoanDto,
} from './dto/loan-management.schema';

@Injectable()
export class LoanManagementService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly bankMovementsService: BankMovementsService,
    private readonly auditHelper: AuditHelper,
  ) { }

  // ─── SISTEMA FRANCÉS ────────────────────────────────────────────────────

  calculateMonthlyPayment(
    amount: number,
    annualRate: number,
    numInstallments: number,
    termType: 'installments' | 'quotas',
  ): number {
    const periodsPerYear = termType === 'installments' ? 24 : 12;
    const r = annualRate / 100 / periodsPerYear;
    if (r === 0 || numInstallments === 0) return amount / (numInstallments || 1);
    const factor = Math.pow(1 + r, numInstallments);
    return (amount * r * factor) / (factor - 1);
  }

  calculateEndDate(
    startDate: Date,
    numInstallments: number,
    termType: 'installments' | 'quotas',
  ): Date {
    const start = new Date(startDate);
    if (termType === 'installments') {
      const totalDays = numInstallments * 15;
      return new Date(start.getTime() + totalDays * 86400000);
    }
    start.setMonth(start.getMonth() + numInstallments);
    return start;
  }

  generateAmortizationSchedule(
    capitalAmount: number,
    numInstallments: number,
    annualInterestRate: number,
    startDate: Date,
    loanId: string,
    createdById: string,
    termType: 'installments' | 'quotas',
    expensesAmount: number = 0,
  ) {
    const periodsPerYear = termType === 'installments' ? 24 : 12;
    const r = annualInterestRate / 100 / periodsPerYear;
    const n = numInstallments;
    const factor = r === 0 ? 1 : Math.pow(1 + r, n);
    const frenchInstallment = r === 0
      ? capitalAmount / n
      : (capitalAmount * r * factor) / (factor - 1);
    const expensePerInstallment = expensesAmount / n;

    const getLastDayOfMonth = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const getNextBiweeklyDueDate = (
      current: Date,
      isFirstHalf: boolean,
    ): Date => {
      const year = current.getFullYear();
      const month = current.getMonth();
      let targetMonth = month;
      let targetYear = year;
      if (isFirstHalf) {
        if (current.getDate() > 16) {
          targetMonth += 1;
          if (targetMonth > 11) {
            targetMonth = 0;
            targetYear++;
          }
        }
        return new Date(targetYear, targetMonth, 16);
      } else {
        const lastDay = getLastDayOfMonth(
          new Date(targetYear, targetMonth, 1),
        );
        if (current.getDate() > lastDay.getDate() - 1) {
          targetMonth += 1;
          if (targetMonth > 11) {
            targetMonth = 0;
            targetYear++;
          }
        }
        return new Date(targetYear, targetMonth + 1, 0);
      }
    };

    const start = new Date(startDate);
    let nextDueDate: Date;
    if (termType === 'installments') {
      if (start.getDate() <= 15) {
        nextDueDate = getNextBiweeklyDueDate(start, false);
      } else {
        nextDueDate = getNextBiweeklyDueDate(start, true);
      }
    } else {
      nextDueDate = getLastDayOfMonth(start);
    }

    const schedule: any[] = [];
    let remaining = capitalAmount;

    for (let i = 1; i <= n; i++) {
      const interestThisPeriod = remaining * r;
      let principalThisPeriod = frenchInstallment - interestThisPeriod;
      let total = frenchInstallment + expensePerInstallment;

      if (i === n) {
        principalThisPeriod = remaining;
        total = principalThisPeriod + interestThisPeriod + expensePerInstallment;
      }

      remaining -= principalThisPeriod;

      schedule.push({
        loanId,
        installmentNumber: i,
        dueDate: new Date(nextDueDate),
        principalAmount: String(parseFloat(principalThisPeriod.toFixed(6))),
        interestAmount: String(parseFloat(interestThisPeriod.toFixed(6))),
        totalInstallmentAmount: String(parseFloat(total.toFixed(6))),
        principalBalancePending: String(
          parseFloat(Math.max(0, remaining).toFixed(6)),
        ),
        paymentStatus: PaymentStatusEnum.PENDING,
        createdById,
      });

      if (termType === 'installments') {
        if (nextDueDate.getDate() === 16) {
          nextDueDate = getNextBiweeklyDueDate(nextDueDate, false);
        } else {
          nextDueDate = getNextBiweeklyDueDate(nextDueDate, true);
        }
      } else {
        nextDueDate = getLastDayOfMonth(
          new Date(
            nextDueDate.getFullYear(),
            nextDueDate.getMonth() + 1,
            1,
          ),
        );
      }
    }

    return schedule;
  }

  // ─── BÚSQUEDA DE ASOCIADO ───────────────────────────────────────────────

  async searchAssociate(tenantId: string, cedula: string) {
    const [assoc] = await this.db
      .select({
        id: associates.id,
        cedula: associates.cedula,
        fullname: associates.fullname,
        baseSalary: associates.baseSalary,
        isPayrollCredit: associates.isPayrollCredit,
        phone: associates.phone,
        email: associates.email,
        dateAdmission: associates.dateAdmission,
        status: associates.status,
      })
      .from(associates)
      .where(
        and(
          eq(associates.cedula, cedula),
          eq(associates.tenantId, tenantId),
        ),
      );

    if (!assoc) {
      throw new NotFoundException(
        `Asociado con cédula ${cedula} no encontrado`,
      );
    }

    const [account] = await this.db
      .select({
        id: associateAccounts.id,
        accountNumber: associateAccounts.accountNumber,
        balance: associateHaberesBalance.haberesBalance,
      })
      .from(associateAccounts)
      .leftJoin(
        associateHaberesBalance,
        eq(
          associateHaberesBalance.associateAccountId,
          associateAccounts.id,
        ),
      )
      .where(eq(associateAccounts.associateId, assoc.id));

    if (!account) {
      return {
        associate: assoc,
        account: null,
        balance: 0,
        available80: 0,
        hasActiveLoan: false,
        hasActiveCredit: false,
        hasPayrollCredit: false,
        baseSalary: Number(assoc.baseSalary ?? 0),
        paymentCapacity: 0,
      };
    }

    const activeLoans = await this.db
      .select({ id: loans.id })
      .from(loans)
      .where(
        and(
          eq(loans.tenantId, tenantId),
          eq(loans.associateId, assoc.id),
          or(
            eq(loans.status, LoanStatusEnum.APPROVED),
            eq(loans.status, LoanStatusEnum.DISBURSED),
            eq(loans.status, LoanStatusEnum.IN_PAYMENT),
            eq(loans.status, LoanStatusEnum.OVERDUE),
            eq(loans.status, LoanStatusEnum.REQUESTED),
          ),
        ),
      )
      .limit(1);

    const activeCredits = await this.db
      .select({ id: schema.credits.id })
      .from(schema.credits)
      .where(
        and(
          eq(schema.credits.tenantId, tenantId),
          eq(schema.credits.associateId, assoc.id),
          or(
            eq(schema.credits.status, 'REQUESTED' as any),
            eq(schema.credits.status, 'APPROVED' as any),
            eq(schema.credits.status, 'IN_PAYMENT' as any),
          ),
        ),
      )
      .limit(1);

    const balance = Number(account.balance ?? 0);
    const available80 = balance * 0.8;
    const paymentCapacity = (Number(assoc.baseSalary ?? 0)) * 0.3;

    return {
      associate: assoc,
      account,
      balance,
      available80,
      hasActiveLoan: activeLoans.length > 0,
      hasActiveCredit: activeCredits.length > 0,
      hasPayrollCredit: !!assoc.isPayrollCredit,
      baseSalary: Number(assoc.baseSalary ?? 0),
      paymentCapacity,
    };
  }

  // ─── CÁLCULO DE AMORTIZACIÓN ───────────────────────────────────────────

  async calculateAmortization(params: {
    amount: number;
    annualRate: number;
    paymentCount: number;
    startDate: Date;
    paymentType: 'installments' | 'quotas';
    expensesPercentage?: number;
  }) {
    const expenseAmount =
      (params.amount * (params.expensesPercentage || 0)) / 100;
    const capital = params.amount;

    const schedule = this.generateAmortizationSchedule(
      capital,
      params.paymentCount,
      params.annualRate,
      params.startDate,
      'preview',
      'preview',
      params.paymentType,
      expenseAmount,
    );

    return {
      schedule: schedule.map((s) => ({
        ...s,
        loanId: undefined,
        createdById: undefined,
        dueDate: (s.dueDate as Date).toISOString(),
      })),
      monthlyPayment: schedule[0]?.totalInstallmentAmount || '0',
      capital: String(capital.toFixed(6)),
      expenseAmount: String(expenseAmount.toFixed(6)),
      netAmount: String(params.amount.toFixed(6)),
    };
  }



  // ─── SOLICITAR PRÉSTAMO ─────────────────────────────────────────────────

  async request(
    tenantId: string,
    userId: string,
    dto: CreateLoanDto,
  ): Promise<{ id: string; customReference: string | null }> {
    const {
      associateId,
      requestedAmount,
      loanTypeId,
      startDate,
      interestRate,
      termType,
      termUnits,
      expensesPercentage,
    } = dto;

    const [loanType] = await this.db
      .select()
      .from(loanTypes)
      .where(
        and(
          eq(loanTypes.id, loanTypeId),
          eq(loanTypes.tenantId, tenantId),
        ),
      );

    if (!loanType) {
      throw new NotFoundException('Tipo de préstamo no encontrado');
    }

    const [assoc] = await this.db
      .select({
        isPayrollCredit: associates.isPayrollCredit,
        baseSalary: associates.baseSalary,
      })
      .from(associates)
      .where(
        and(
          eq(associates.id, associateId),
          eq(associates.tenantId, tenantId),
        ),
      );

    if (!assoc) {
      throw new NotFoundException('Asociado no encontrado');
    }

    if (assoc.isPayrollCredit) {
      throw new BadRequestException(
        'El asociado tiene credinomina activo, no puede solicitar préstamos',
      );
    }

    if (loanType.minLoanAmount && Number(loanType.minLoanAmount) > 0 && requestedAmount < Number(loanType.minLoanAmount)) {
      throw new BadRequestException(
        `El monto mínimo para este tipo de préstamo es ${Number(loanType.minLoanAmount).toLocaleString('es')}`,
      );
    }
    if (loanType.maxLoanAmount && Number(loanType.maxLoanAmount) > 0 && requestedAmount > Number(loanType.maxLoanAmount)) {
      throw new BadRequestException(
        `El monto máximo para este tipo de préstamo es ${Number(loanType.maxLoanAmount).toLocaleString('es')}`,
      );
    }

    const activeLoanStatuses: LoanStatusEnum[] = [
      LoanStatusEnum.REQUESTED,
      LoanStatusEnum.APPROVED,
      LoanStatusEnum.DISBURSED,
      LoanStatusEnum.IN_PAYMENT,
      LoanStatusEnum.OVERDUE,
    ];

    const existingLoans = await this.db
      .select({ id: loans.id })
      .from(loans)
      .where(
        and(
          eq(loans.tenantId, tenantId),
          eq(loans.associateId, associateId),
          or(
            eq(loans.status, LoanStatusEnum.REQUESTED),
            eq(loans.status, LoanStatusEnum.APPROVED),
            eq(loans.status, LoanStatusEnum.DISBURSED),
            eq(loans.status, LoanStatusEnum.IN_PAYMENT),
            eq(loans.status, LoanStatusEnum.OVERDUE),
          ),
        ),
      );

    if (existingLoans.length > 0) {
      throw new BadRequestException(
        'El asociado ya tiene un préstamo en proceso o activo',
      );
    }

    const activeCredits = await this.db
      .select({ id: schema.credits.id })
      .from(schema.credits)
      .where(
        and(
          eq(schema.credits.tenantId, tenantId),
          eq(schema.credits.associateId, associateId),
          or(
            eq(schema.credits.status, 'REQUESTED' as any),
            eq(schema.credits.status, 'APPROVED' as any),
            eq(schema.credits.status, 'IN_PAYMENT' as any),
          ),
        ),
      );

    if (activeCredits.length > 0) {
      throw new BadRequestException(
        'El asociado tiene un crédito activo, no puede solicitar préstamos',
      );
    }

    const [account] = await this.db
      .select({
        id: associateAccounts.id,
        balance: associateHaberesBalance.haberesBalance,
      })
      .from(associateAccounts)
      .leftJoin(
        associateHaberesBalance,
        eq(
          associateHaberesBalance.associateAccountId,
          associateAccounts.id,
        ),
      )
      .where(eq(associateAccounts.associateId, associateId));

    if (!account) {
      throw new BadRequestException('Cuenta de asociado no encontrada');
    }

    const balance = Number(account.balance ?? 0);
    const available80 = balance * 0.8;

    if (requestedAmount > available80) {
      throw new BadRequestException(
        `El monto solicitado (${requestedAmount.toLocaleString('es')}) supera el 80% disponible (${available80.toLocaleString('es')})`,
      );
    }

    const finalRate = interestRate ?? Number(loanType.interestRate);
    const finalTermUnits = termUnits ?? loanType.termUnits;
    const finalTermType = (termType ?? loanType.termType) as 'installments' | 'quotas';
    const expensePct = expensesPercentage ?? Number(loanType.administrativeExpensePercentage ?? 0);
    const expensesAmount = (requestedAmount * expensePct) / 100;

    const capital = requestedAmount;
    const expensePerInstallment = expensesAmount / finalTermUnits;

    if (capital > 0) {
      const monthlyPayment = this.calculateMonthlyPayment(
        capital,
        finalRate,
        finalTermUnits,
        finalTermType,
      );
      const totalPeriodPayment = monthlyPayment + expensePerInstallment;
      const paymentCapacity = (Number(assoc.baseSalary ?? 0)) * 0.3;
      if (totalPeriodPayment > paymentCapacity) {
        throw new BadRequestException(
          `La cuota mensual (${totalPeriodPayment.toLocaleString('es', { minimumFractionDigits: 2 })}) supera su capacidad de pago del 30% (${paymentCapacity.toLocaleString('es', { minimumFractionDigits: 2 })})`,
        );
      }
    }

    const dup = await this.db
      .select()
      .from(loans)
      .where(
        and(
          eq(loans.tenantId, tenantId),
          eq(loans.associateId, associateId),
          eq(loans.requestedAmount, String(requestedAmount)),
          eq(loans.loanTypeId, loanTypeId),
          eq(loans.status, LoanStatusEnum.REQUESTED),
        ),
      );

    if (dup.length) {
      throw new InternalServerErrorException('Solicitud duplicada');
    }

    const setting = await this.db.query.moduleSettings.findFirst({
      where: and(
        eq(moduleSettings.key, 'MONEDA'),
        eq(moduleSettings.tenantId, tenantId),
      ),
    });

    const currencyCode: CurrencyCodeEnum =
      setting?.value === '2' ? CurrencyCodeEnum.USD : CurrencyCodeEnum.VES;

    const endDate = this.calculateEndDate(startDate, finalTermUnits, finalTermType);

    const periodsPerYear = finalTermType === 'installments' ? 24 : 12;
    const r = finalRate / 100 / periodsPerYear;
    const factor = r === 0 ? 1 : Math.pow(1 + r, finalTermUnits);
    const frenchInstallment = capital > 0
      ? (capital * r * factor) / (factor - 1)
      : 0;
    const totalInterest = frenchInstallment * finalTermUnits - capital;
    const totalInstallment = frenchInstallment + expensePerInstallment;
    const totalPayable = totalInstallment * finalTermUnits;

    const schedule = capital > 0
      ? this.generateAmortizationSchedule(
        capital,
        finalTermUnits,
        finalRate,
        startDate,
        '',
        userId,
        finalTermType,
        expensesAmount,
      )
      : [];

    const newLoan = await this.db.transaction(async (tx) => {
      const [ins] = await tx
        .insert(loans)
        .values({
          tenantId,
          associateId,
          loanTypeId,
          loanModality: dto.loanModality,
          requestedAmount: String(requestedAmount),
          approvedAmount: String(capital.toFixed(6)),
          status: LoanStatusEnum.REQUESTED,
          startDate: startDate.toISOString(),
          requestDate: (dto.requestDate ?? new Date()).toISOString(),
          endDate: endDate.toISOString(),
          currencyCode,
          termType: finalTermType,
          termUnits: finalTermUnits,
          interestRate: String(finalRate),
          installmentAmount: String(totalInstallment.toFixed(6)),
          totalInterest: String(totalInterest.toFixed(6)),
          totalPayable: String(totalPayable.toFixed(6)),
          expensesAmount: String(expensesAmount.toFixed(6)),
          expensesPercentage: String(expensePct),
          paymentMethod: dto.paymentMethod,
          notes: dto.notes ?? null,
          createdById: userId,
          updatedById: userId,
        })
        .returning({
          id: loans.id,
          customReference: loans.customReference,
        });

      if (schedule.length > 0) {
        const scheduleRows = schedule.map((s: any) => ({
          ...s,
          loanId: ins.id,
          dueDate: (s.dueDate as Date).toISOString(),
        }));
        await tx.insert(loanAmortizationSchedule).values(scheduleRows);
      }

      await tx.insert(loanStatusHistory).values({
        loanId: ins.id,
        status: LoanStatusEnum.REQUESTED,
        changedByUserId: userId,
        comment: 'LOAN REQUESTED',
      });

      return ins;
    });

    await this.auditHelper.logCreate(userId, 'loan', newLoan, {
      tenantId,
      targetId: newLoan.id,
      description: `Loan requested for associate ${associateId}`,
    });

    return { id: newLoan.id, customReference: newLoan.customReference };
  }

  // ─── APROBAR PRÉSTAMO ───────────────────────────────────────────────────

  async approve(
    tenantId: string,
    userId: string,
    id: string,
  ): Promise<{ id: string; customReference: string | null }> {
    return this.db.transaction(async (tx) => {
      const [loan] = await tx
        .select()
        .from(loans)
        .where(and(eq(loans.id, id), eq(loans.tenantId, tenantId)))
        .for('update');

      if (!loan) throw new NotFoundException('Préstamo no encontrado');
      if (loan.status !== LoanStatusEnum.REQUESTED)
        throw new BadRequestException(
          'Solo se pueden aprobar préstamos en estado REQUESTED',
        );

      const {
        associateId,
        requestedAmount,
        loanTypeId,
        startDate,
        expensesPercentage: savedExpensesPercentage,
      } = loan;

      const active = await tx
        .select()
        .from(loans)
        .where(
          and(
            eq(loans.tenantId, tenantId),
            eq(loans.associateId, associateId),
            eq(loans.status, LoanStatusEnum.APPROVED),
            ne(loans.id, id),
          ),
        );
      if (active.length)
        throw new BadRequestException('El asociado ya tiene un préstamo aprobado');

      const [assoc] = await tx
        .select({
          isPayrollCredit: associates.isPayrollCredit,
          balance: associateHaberesBalance.haberesBalance,
          associateAccountId: associateAccounts.id,
        })
        .from(associates)
        .where(
          and(
            eq(associates.id, associateId),
            eq(associates.tenantId, tenantId),
          ),
        )
        .leftJoin(
          associateAccounts,
          eq(associateAccounts.associateId, associateId),
        )
        .leftJoin(
          associateHaberesBalance,
          eq(
            associateHaberesBalance.associateAccountId,
            associateAccounts.id,
          ),
        );

      if (assoc?.isPayrollCredit)
        throw new BadRequestException('Crédito nómina activo');

      const avail = (Number(assoc?.balance ?? 0)) * 0.8;
      const reqAmt = Number(requestedAmount);
      if (reqAmt > avail)
        throw new BadRequestException('Disponibilidad insuficiente (80% regla)');

      const [loanType] = await tx
        .select()
        .from(loanTypes)
        .where(
          and(eq(loanTypes.id, loanTypeId), eq(loanTypes.tenantId, tenantId)),
        );

      const finalRate = loan.interestRate
        ? Number(loan.interestRate)
        : Number(loanType?.interestRate ?? 0);
      const finalTermUnits = loan.termUnits ?? loanType?.termUnits ?? 1;
      const finalTermType = (loan.termType ?? loanType?.termType ?? 'PLAZO') as 'installments' | 'quotas';

      const expensePct = savedExpensesPercentage
        ? Number(savedExpensesPercentage)
        : Number(loanType?.administrativeExpensePercentage ?? 0);
      const expensesAmount = (reqAmt * expensePct) / 100;

      const capital = reqAmt;
      const expensePerInstallment = expensesAmount / finalTermUnits;

      const periodsPerYear = finalTermType === 'installments' ? 24 : 12;
      const r = finalRate / 100 / periodsPerYear;
      const n = finalTermUnits;
      const factor = Math.pow(1 + r, n);
      const frenchInstallment = capital > 0
        ? (capital * r * factor) / (factor - 1)
        : 0;
      const totalInterest = frenchInstallment * n - capital;
      const totalInstallment = frenchInstallment + expensePerInstallment;
      const totalPayable = totalInstallment * n;

      const endDate = this.calculateEndDate(
        startDate ? new Date(startDate) : new Date(),
        finalTermUnits,
        finalTermType,
      );

      const customReference =
        await this.generateCodeService.generateNextReference(
          'PRE',
          tenantId,
          'portfolio',
          'loans',
        );
      const approvalDate = new Date();

      const [updatedLoan] = await tx
        .update(loans)
        .set({
          status: LoanStatusEnum.APPROVED,
          approvalDate: approvalDate.toISOString(),
          customReference,
          approvedByUserId: userId,
          endDate: endDate.toISOString(),
          totalInterest: String(totalInterest.toFixed(6)),
          installmentAmount: String(totalInstallment.toFixed(6)),
          expensesAmount: String(expensesAmount.toFixed(6)),
          totalPayable: String(totalPayable.toFixed(6)),
          approvedAmount: String(capital.toFixed(6)),
          disbursedAmount: String(reqAmt.toFixed(6)),
          updatedById: userId,
        })
        .where(and(eq(loans.id, id), eq(loans.tenantId, tenantId)))
        .returning({
          id: loans.id,
          customReference: loans.customReference,
        });

      await tx.insert(loanStatusHistory).values({
        loanId: id,
        status: LoanStatusEnum.APPROVED,
        changedByUserId: userId,
        comment: 'LOAN APPROVED',
      });

      const existingSchedule = await tx
        .select()
        .from(loanAmortizationSchedule)
        .where(eq(loanAmortizationSchedule.loanId, id));

      if (existingSchedule.length === 0 && capital > 0) {
        const schedule = this.generateAmortizationSchedule(
          capital,
          n,
          finalRate,
          startDate ? new Date(startDate) : new Date(),
          id,
          userId,
          finalTermType,
          expensesAmount,
        );
        if (schedule.length > 0) {
          await tx.insert(loanAmortizationSchedule).values(
            schedule.map((s: any) => ({
              ...s,
              dueDate: (s.dueDate as Date).toISOString(),
            })),
          );
        }
      }

      // Movimiento de cuenta del asociado
      if (assoc?.associateAccountId) {
        const movementType: AssociateMovementTypeEnum =
          loan.loanModality === 'SPECIAL_QUOTAS'
            ? AssociateMovementTypeEnum.SPECIAL_LOAN_DISBURSEMENT_CREDIT
            : AssociateMovementTypeEnum.LOAN_DISBURSEMENT_CREDIT;

        const setting = await tx.query.moduleSettings.findFirst({
          where: and(
            eq(moduleSettings.key, 'MONEDA'),
            eq(moduleSettings.tenantId, tenantId),
          ),
        });
        const currencyCode: CurrencyCodeEnum =
          setting?.value === '2' ? CurrencyCodeEnum.USD : CurrencyCodeEnum.VES;

        await this.associateAccountsMovementsService.create(
          userId,
          {
            associateAccountId: assoc.associateAccountId,
            movementType,
            amount: capital,
            currencyCode,
            transactionDate: new Date(),
            description: `Préstamo Aprobado N°${customReference}`,
            referenceId: String(id),
            referenceType: 'loans',
          },
          tenantId,
        );

        if (expensesAmount > 0) {
          await this.associateAccountsMovementsService.create(
            userId,
            {
              associateAccountId: assoc.associateAccountId,
              movementType: AssociateMovementTypeEnum.LOAN_ADMIN_FEE_DEBIT,
              amount: expensesAmount,
              currencyCode,
              transactionDate: new Date(),
              description: `Gastos Administrativos Préstamo N°${customReference}`,
              referenceId: String(id),
              referenceType: 'loans',
            },
            tenantId,
          );
        }
      }

      await this.auditHelper.logUpdate(userId, 'loan', loan, updatedLoan, {
        tenantId,
        targetId: id,
        description: `Préstamo Aprobado N°${customReference}`,
      });

      return updatedLoan;
    });
  }

  // ─── DESEMBOLSAR PRÉSTAMO ───────────────────────────────────────────────

  async disburse(
    tenantId: string,
    userId: string,
    id: string,
    dto: DisburseLoanDto,
  ): Promise<{ id: string; customReference: string | null }> {
    return this.db.transaction(async (tx) => {
      const [loan] = await tx
        .select()
        .from(loans)
        .where(and(eq(loans.id, id), eq(loans.tenantId, tenantId)))
        .for('update');

      if (!loan) throw new NotFoundException('Préstamo no encontrado');
      if (loan.status !== LoanStatusEnum.APPROVED)
        throw new BadRequestException(
          'Solo se pueden desembolsar préstamos en estado APPROVED',
        );

      const disbursementDate = dto.disbursementDate ?? new Date();

      const methodMap: Record<string, paymentMethodEnum> = {
        transfer: paymentMethodEnum.BANK_TRANSFER,
        deposit: paymentMethodEnum.DEPOSIT,
        pago_movil: paymentMethodEnum.MOBILE_PAYMENT,
        check: paymentMethodEnum.CHECK,
        cash: paymentMethodEnum.CASH,
      };
      const paymentMethod = methodMap[dto.paymentMethod as string] ?? paymentMethodEnum.BANK_TRANSFER;

      const [updatedLoan] = await tx
        .update(loans)
        .set({
          status: LoanStatusEnum.DISBURSED,
          disbursementDate: disbursementDate.toISOString(),
          disbursedByUserId: userId,
          paymentMethod,
          updatedById: userId,
        })
        .where(and(eq(loans.id, id), eq(loans.tenantId, tenantId)))
        .returning({
          id: loans.id,
          customReference: loans.customReference,
        });

      await tx.insert(loanStatusHistory).values({
        loanId: id,
        status: LoanStatusEnum.DISBURSED,
        changedByUserId: userId,
        comment: dto.description ?? 'LOAN DISBURSED',
      });

      if (dto.bankAccountId) {
        await this.bankMovementsService.createAndReconcile(
          {
            movement: {
              bankAccountId: dto.bankAccountId,
              transactionDate: disbursementDate,
              paymentMethod,
              description: dto.description ?? `Desembolso Préstamo N°${loan.customReference ?? id}`,
              bankReference: dto.bankReference ?? undefined,
              category: 'LOAN_DISBURSEMENT' as BankTransactionCategory,
              creditAmount: 0,
              debitAmount: Number(loan.disbursedAmount ?? loan.requestedAmount ?? 0),
            },
            links: [
              {
                internalRecordType: 'LOAN_DISBURSEMENT',
                internalRecordId: id,
              },
            ],
          },
          userId,
          tenantId,
        );
      }

      await this.auditHelper.logUpdate(userId, 'loan', loan, updatedLoan, {
        tenantId,
        targetId: id,
        description: `Préstamo Desembolsado N°${loan.customReference ?? id}`,
      });

      return { id: updatedLoan.id, customReference: updatedLoan.customReference ?? null };
    });
  }

  // ─── LISTAR TODOS (PAGINADO) ────────────────────────────────────────────

  async findAll(tenantId: string, dto: FilterLoanDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      searchType = '',
      sortBy = 'id',
      sortOrder = 'desc',
      status = '',
      type = '',
      modality = '',
    } = dto || {};

    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [eq(loans.tenantId, tenantId)];

    if (search) {
      switch (searchType) {
        case 'cedula':
          conditions.push(ilike(associates.cedula, `%${search}%`));
          break;
        case 'fullname':
          conditions.push(ilike(associates.fullname, `%${search}%`));
          break;
        default:
          conditions.push(
            ilike(loans.customReference ?? sql`''`, `%${search}%`),
          );
          break;
      }
    }

    if (status) {
      conditions.push(eq(loans.status, status as LoanStatusEnum));
    }

    if (type) {
      conditions.push(eq(loans.loanTypeId, type));
    }

    if (modality) {
      conditions.push(eq(loans.loanModality, modality as loanModalityTypeEnum));
    }

    const where = and(...conditions);

    const orderBy =
      sortOrder === 'asc'
        ? sql`${loans[sortBy as keyof typeof loans]} asc`
        : sql`${loans[sortBy as keyof typeof loans]} desc`;

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .leftJoin(associates, eq(loans.associateId, associates.id))
      .leftJoin(loanTypes, eq(loans.loanTypeId, loanTypes.id))
      .where(where);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select({
        id: loans.id,
        associateId: loans.associateId,
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
        associateAccountNumber: associateAccounts.accountNumber,
        loanTypeId: loans.loanTypeId,
        loanModality: loans.loanModality,
        loanTypeName: loanTypes.name,
        loanTypeInterestRate: loanTypes.interestRate,
        loanTypeTermUnits: sql<string>`${loanTypes.termUnits}`,
        requestDate: loans.requestDate,
        approvalDate: loans.approvalDate,
        disbursementDate: loans.disbursementDate,
        requestedAmount: loans.requestedAmount,
        approvedAmount: loans.approvedAmount,
        disbursedAmount: loans.disbursedAmount,
        startDate: loans.startDate,
        endDate: loans.endDate,
        totalInterest: loans.totalInterest,
        installmentAmount: loans.installmentAmount,
        totalPayable: loans.totalPayable,
        expensesAmount: loans.expensesAmount,
        overdraftAmount: loans.overdraftAmount,
        previousLoanId: loans.previousLoanId,
        paymentMethod: loans.paymentMethod,
        disbursementAccountId: loans.disbursementAccountId,
        status: loans.status,
        rejectionReason: loans.rejectionReason,
        approvedByUserId: loans.approvedByUserId,
        disbursedByUserId: loans.disbursedByUserId,
        notes: loans.notes,
        customReference: loans.customReference,
        currencyCode: loans.currencyCode,
        exchangeRateId: loans.exchangeRateId,
        termType: loans.termType,
        termUnits: loans.termUnits,
        interestRate: loans.interestRate,
      })
      .from(loans)
      .where(where)
      .orderBy(orderBy)
      .leftJoin(associates, eq(loans.associateId, associates.id))
      .leftJoin(loanTypes, eq(loans.loanTypeId, loanTypes.id))
      .leftJoin(
        associateAccounts,
        eq(loans.associateId, associateAccounts.associateId),
      )
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
      data: data.map((loan) => ({
        ...loan,
        requestedAmount: Number(loan.requestedAmount).toFixed(2),
        approvedAmount: loan.approvedAmount
          ? Number(loan.approvedAmount).toFixed(2)
          : null,
        disbursedAmount: loan.disbursedAmount
          ? Number(loan.disbursedAmount).toFixed(2)
          : null,
        installmentAmount: loan.installmentAmount
          ? Number(loan.installmentAmount).toFixed(2)
          : null,
        totalInterest: loan.totalInterest
          ? Number(loan.totalInterest).toFixed(2)
          : null,
        totalPayable: loan.totalPayable
          ? Number(loan.totalPayable).toFixed(2)
          : null,
        expensesAmount: loan.expensesAmount
          ? Number(loan.expensesAmount).toFixed(2)
          : null,
      })),
      meta,
    };
  }

  // ─── ENCONTRAR POR EDICIÓN ──────────────────────────────────────────────

  async findRequestByEdit(id: string, tenantId: string) {
    const [data] = await this.db
      .select({
        id: loans.id,
        associateId: loans.associateId,
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
        associatePhone: associates.phone,
        associateEmail: associates.email,
        associateDateAdmission: associates.dateAdmission,
        associateIsPayrollCredit: associates.isPayrollCredit,
        associateAccountId: associateAccounts.id,
        associateAccountNumber: associateAccounts.accountNumber,
        associateBalance: associateHaberesBalance.haberesBalance,
        loanTypeId: loans.loanTypeId,
        loanModality: loans.loanModality,
        loanTypeName: loanTypes.name,
        requestDate: loans.requestDate,
        approvalDate: loans.approvalDate,
        disbursementDate: loans.disbursementDate,
        requestedAmount: loans.requestedAmount,
        approvedAmount: loans.approvedAmount,
        disbursedAmount: loans.disbursedAmount,
        startDate: loans.startDate,
        endDate: loans.endDate,
        totalInterest: loans.totalInterest,
        totalPayable: loans.totalPayable,
        expensesAmount: loans.expensesAmount,
        overdraftAmount: loans.overdraftAmount,
        previousLoanId: loans.previousLoanId,
        paymentMethod: loans.paymentMethod,
        disbursementAccountId: loans.disbursementAccountId,
        status: loans.status,
        rejectionReason: loans.rejectionReason,
        approvedByUserId: loans.approvedByUserId,
        disbursedByUserId: loans.disbursedByUserId,
        notes: loans.notes,
        customReference: loans.customReference,
        currencyCode: loans.currencyCode,
        exchangeRateId: loans.exchangeRateId,
        termType: loans.termType,
        termUnits: loans.termUnits,
        interestRate: loans.interestRate,
      })
      .from(loans)
      .where(and(eq(loans.id, id), eq(loans.tenantId, tenantId)))
      .leftJoin(associates, eq(loans.associateId, associates.id))
      .leftJoin(
        associateAccounts,
        eq(loans.associateId, associateAccounts.associateId),
      )
      .leftJoin(
        associateHaberesBalance,
        eq(associateHaberesBalance.associateAccountId, associateAccounts.id),
      )
      .leftJoin(loanTypes, eq(loans.loanTypeId, loanTypes.id));

    if (!data) {
      throw new NotFoundException('Loan not found');
    }

    const [{ count: total }] = await this.db
      .select({ count: count() })
      .from(loans)
      .where(
        and(
          eq(loans.tenantId, tenantId),
          eq(loans.associateId, data.associateId),
          ne(loans.status, LoanStatusEnum.PAID),
        ),
      );

    return { ...data, totalLoans: total };
  }

  // ─── BUSCAR ASOCIADO POR CÉDULA (para el modal) ─────────────────────────

  async findOneRequest(cedula: string, tenantId: string) {
    const [associate] = await this.db
      .select({
        id: associates.id,
        cedula: associates.cedula,
        fullname: associates.fullname,
        phone: associates.phone,
        email: associates.email,
        dateAdmission: associates.dateAdmission,
        isPayrollCredit: associates.isPayrollCredit,
        status: associates.status,
        baseSalary: associates.baseSalary,
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

    const [associateAccount] = await this.db
      .select({
        associateAccountId: associateAccounts.id,
        accountNumber: associateAccounts.accountNumber,
        balance: associateHaberesBalance.haberesBalance,
      })
      .from(associateAccounts)
      .leftJoin(
        associateHaberesBalance,
        eq(associateHaberesBalance.associateAccountId, associateAccounts.id),
      )
      .where(eq(associateAccounts.associateId, associate.id));

    const [{ count: total }] = await this.db
      .select({ count: count() })
      .from(loans)
      .where(
        and(
          eq(loans.tenantId, tenantId),
          eq(loans.associateId, associate.id),
          ne(loans.status, LoanStatusEnum.PAID),
          ne(loans.status, LoanStatusEnum.REQUESTED),
          ne(loans.status, LoanStatusEnum.CANCELLED),
          ne(loans.status, LoanStatusEnum.REJECTED),
        ),
      );

    const [{ count: totalCredit }] = await this.db
      .select({ count: count() })
      .from(schema.credits)
      .where(
        and(
          eq(schema.credits.tenantId, tenantId),
          eq(schema.credits.associateId, associate.id),
          ne(schema.credits.status, 'PAID' as any),
          ne(schema.credits.status, 'REQUESTED' as any),
        ),
      );

    const baseSalary = associate.baseSalary ? Number(associate.baseSalary) : 0;
    const paymentCapacity = Number((baseSalary * 0.3).toFixed(2));

    return {
      associate: {
        ...associate,
        associateAccountId: associateAccount?.associateAccountId,
        accountNumber: associateAccount?.accountNumber,
        balance: Number(associateAccount?.balance ?? 0).toFixed(2),
        baseSalary: baseSalary.toFixed(2),
        paymentCapacity: paymentCapacity.toFixed(2),
      },
      totalLoans: total,
      totalCredits: totalCredit,
    };
  }

  // ─── ENCONTRAR UNO ──────────────────────────────────────────────────────

  async findOne(tenantId: string, id: string) {
    const [loan] = await this.db
      .select()
      .from(loans)
      .where(and(eq(loans.id, id), eq(loans.tenantId, tenantId)));

    if (!loan) {
      throw new NotFoundException('Préstamo no encontrado');
    }

    return loan;
  }

  // ─── ACTUALIZAR ─────────────────────────────────────────────────────────

  async update(
    id: string,
    tenantId: string,
    userId: string,
    dto: UpdateLoanDto,
  ) {
    const [existingLoan] = await this.db
      .select()
      .from(loans)
      .where(and(eq(loans.id, id), eq(loans.tenantId, tenantId)));

    if (!existingLoan) {
      throw new InternalServerErrorException('Loan not found.');
    }

    if (existingLoan.status !== 'REQUESTED') {
      throw new InternalServerErrorException(
        'A loan with a status other than requested cannot be updated.',
      );
    }

    const [getLoanTypes] = await this.db
      .select()
      .from(loanTypes)
      .where(
        and(
          eq(loanTypes.id, dto.loanTypeId ?? existingLoan.loanTypeId),
          eq(loanTypes.tenantId, tenantId),
        ),
      );

    const annualInterestRate = dto.interestRate
      ? dto.interestRate
      : parseFloat(getLoanTypes.interestRate);

    const numInstallments = dto.termUnits ?? getLoanTypes.termUnits;
    const resolvedTermType = dto.termType ?? getLoanTypes.termType ?? 'Plazos';
    const expensePercentage =
      dto.expensesPercentage !== undefined
        ? dto.expensesPercentage
        : parseFloat(getLoanTypes.administrativeExpensePercentage ?? '0');

    const capital = dto.requestedAmount ?? 0;
    const expensesAmount = (capital * expensePercentage) / 100;
    const expensePerInstallment = expensesAmount / numInstallments;

    const periodsPerYear = resolvedTermType === 'Plazos' ? 24 : 12;
    const r = annualInterestRate / 100 / periodsPerYear;
    const n = numInstallments;
    const factor = Math.pow(1 + r, n);
    const frenchInstallment = capital > 0
      ? (capital * r * factor) / (factor - 1)
      : 0;

    let totalInterest = frenchInstallment * n - capital;
    let totalQuota = frenchInstallment + expensePerInstallment;
    let totalPayable = totalQuota * n;

    const currentDate = new Date();
    const finalDate = this.calculateEndDate(
      dto?.startDate ? new Date(dto.startDate) : currentDate,
      numInstallments,
      resolvedTermType as 'installments' | 'quotas',
    );

    const setting = await this.db.query.moduleSettings.findFirst({
      where: and(
        eq(moduleSettings.key, 'MONEDA'),
        eq(moduleSettings.tenantId, tenantId),
      ),
    });
    const currencyCode: CurrencyCodeEnum =
      setting?.value === '2' ? CurrencyCodeEnum.USD : CurrencyCodeEnum.VES;

    const updatedLoan = await this.db.transaction(async (tx) => {
      const updateSet: Record<string, unknown> = {
        interestRate: dto.interestRate ? String(dto.interestRate) : null,
        loanModality: dto?.loanModality,
        requestDate: dto?.requestDate?.split('T')[0],
        requestedAmount:
          dto.requestedAmount !== null && dto.requestedAmount !== undefined
            ? String(dto.requestedAmount)
            : undefined,
        approvedAmount:
          capital !== null ? String(capital.toFixed(6)) : undefined,
        disbursedAmount:
          dto.requestedAmount !== null && dto.requestedAmount !== undefined
            ? String(dto.requestedAmount)
            : undefined,
        startDate: dto?.startDate?.split('T')[0],
        endDate: finalDate.toISOString().split('T')[0],
        totalInterest:
          totalInterest !== null && totalInterest !== undefined
            ? String(totalInterest.toFixed(6))
            : undefined,
        totalPayable:
          totalPayable !== null && totalPayable !== undefined
            ? String(totalPayable.toFixed(6))
            : undefined,
        installmentAmount:
          totalQuota !== null && totalQuota !== undefined
            ? String(totalQuota.toFixed(6))
            : undefined,
        expensesAmount: String(expensesAmount.toFixed(6)),
        overdraftAmount:
          dto.overdraftAmount !== null && dto.overdraftAmount !== undefined
            ? String(dto.overdraftAmount)
            : undefined,
        previousLoanId: dto.previousLoanId ?? null,
        paymentMethod: dto.paymentMethod,
        disbursementAccountId: dto.disbursementAccountId,
        status: dto?.status,
        approvedByUserId: userId,
        notes: dto.notes ?? null,
        currencyCode,
        updatedById: userId,
        termType: resolvedTermType,
        termUnits: numInstallments,
      };

      if (dto.associateId) {
        updateSet.associateId = dto.associateId;
      }
      if (dto.loanTypeId) {
        updateSet.loanTypeId = dto.loanTypeId;
      }

      const [result] = await tx
        .update(loans)
        .set(updateSet)
        .where(and(eq(loans.id, id), eq(loans.tenantId, tenantId)))
        .returning({
          id: loans.id,
          customReference: loans.customReference,
        });

      if (!result) {
        throw new InternalServerErrorException('Failed to update loan.');
      }

      if (dto?.status === LoanStatusEnum.APPROVED && capital > 0) {
        const schedule = this.generateAmortizationSchedule(
          capital,
          numInstallments,
          annualInterestRate,
          dto.startDate ? new Date(dto.startDate) : new Date(),
          id,
          userId,
          resolvedTermType as 'installments' | 'quotas',
          expensesAmount,
        );
        if (schedule.length > 0) {
          await tx.insert(loanAmortizationSchedule).values(
            schedule.map((item) => ({
              ...item,
              dueDate: item.dueDate.toISOString(),
            })),
          );
        }

        await tx.insert(loanStatusHistory).values({
          loanId: id,
          status: dto.status,
          changedByUserId: userId,
          comment: 'Loan updated',
        });
      }

      return result;
    });

    return updatedLoan;
  }

  // ─── ELIMINAR / ANULAR ──────────────────────────────────────────────────

  async remove(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const [existingLoan] = await this.db
      .select()
      .from(loans)
      .where(and(eq(loans.id, id), eq(loans.tenantId, tenantId)));

    if (!existingLoan) {
      throw new HttpException('Loan not found', HttpStatus.NOT_FOUND);
    }

    if (
      existingLoan.status !== 'APPROVED' &&
      existingLoan.status !== 'REQUESTED'
    ) {
      throw new HttpException(
        'The loan can only be cancelled if the status is requested or approved.',
        HttpStatus.EXPECTATION_FAILED,
      );
    }

    const updatedLoan = await this.db.transaction(async (tx) => {
      await tx
        .update(loans)
        .set({
          status: 'CANCELLED' as LoanStatusEnum,
          updatedById: userId,
        })
        .where(and(eq(loans.id, id), eq(loans.tenantId, tenantId)));

      await tx.insert(loanStatusHistory).values({
        loanId: id,
        status: 'CANCELLED' as LoanStatusEnum,
        changedByUserId: userId,
        comment: 'Loan canceled',
      });

      await tx
        .update(loanAmortizationSchedule)
        .set({ paymentStatus: 'CANCELED' as PaymentStatusEnum })
        .where(eq(loanAmortizationSchedule.loanId, id));

      await this.auditHelper.logDelete(userId, 'loan', existingLoan, {
        tenantId,
        targetId: id,
        description: `Canceled loan ${id}`,
      });

      return true;
    });

    if (!updatedLoan) {
      throw new HttpException(
        'error canceling the loan.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return { message: 'Loan canceled successfully' };
  }

  // ─── CONTADOR DE PRÉSTAMOS ──────────────────────────────────────────────

  async findCountAllLoans(tenantId: string) {
    const totalLoansOrdinary = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .where(
        and(
          eq(loans.tenantId, tenantId),
          eq(loans.loanModality, loanModalityTypeEnum.ORDINARY),
          or(
            eq(loans.status, LoanStatusEnum.APPROVED),
            eq(loans.status, LoanStatusEnum.DISBURSED),
            eq(loans.status, LoanStatusEnum.IN_PAYMENT),
          ),
        ),
      );

    const totalLoanSpecialQuotas = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .where(
        and(
          eq(loans.tenantId, tenantId),
          eq(loans.loanModality, loanModalityTypeEnum.SPECIAL_QUOTAS),
          or(
            eq(loans.status, LoanStatusEnum.APPROVED),
            eq(loans.status, LoanStatusEnum.DISBURSED),
          ),
        ),
      );

    const totalLoanPaid = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .where(
        and(
          eq(loans.tenantId, tenantId),
          eq(loans.status, LoanStatusEnum.PAID),
        ),
      );

    const totalLoanInPaymet = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .where(
        and(
          eq(loans.tenantId, tenantId),
          eq(loans.status, LoanStatusEnum.IN_PAYMENT),
        ),
      );

    const totalLoanRequested = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .where(
        and(
          eq(loans.tenantId, tenantId),
          eq(loans.status, LoanStatusEnum.REQUESTED),
        ),
      );

    const totalLoanDisbursed = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .where(
        and(
          eq(loans.tenantId, tenantId),
          eq(loans.status, LoanStatusEnum.DISBURSED),
        ),
      );

    return {
      totalLoansOrdinary: Number(totalLoansOrdinary[0].count),
      totalLoanSpecialQuotas: Number(totalLoanSpecialQuotas[0].count),
      totalLoanPaid: Number(totalLoanPaid[0].count),
      totalLoanInPaymet: Number(totalLoanInPaymet[0].count),
      totalLoanRequested: Number(totalLoanRequested[0].count),
      totalLoanDisbursed: Number(totalLoanDisbursed[0].count),
    };
  }

  // ─── PRÉSTAMOS APROBADOS ────────────────────────────────────────────────

  async findLoanAprovee(tenantId: string) {
    const data = await this.db
      .select({
        id: loans.id,
        associateId: loans.associateId,
        associateCedula: associates.cedula,
        associateName: associates.fullname,
        reference: loans.customReference,
        approvalDate: loans.approvalDate,
        amount: loans.approvedAmount,
      })
      .from(loans)
      .where(
        and(
          eq(loans.tenantId, tenantId),
          eq(loans.status, LoanStatusEnum.APPROVED),
        ),
      )
      .leftJoin(associates, eq(loans.associateId, associates.id))
      .leftJoin(loanTypes, eq(loans.loanTypeId, loanTypes.id));

    return {
      data: data,
    };
  }

  // ─── PRÉSTAMOS POR ASOCIADO ─────────────────────────────────────────────

  async findAllByAssociate(
    associateId: string,
    tenantId: string,
    filtersDto: FilterLoanDto,
  ) {
    const { page = 1, limit = 10 } = filtersDto || {};

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .leftJoin(loanTypes, eq(loans.loanTypeId, loanTypes.id))
      .leftJoin(
        schema.loanOutstandingBalance,
        eq(loans.id, schema.loanOutstandingBalance.loanId),
      )
      .where(
        and(eq(loans.tenantId, tenantId), eq(loans.associateId, associateId)),
      );

    const totalCount = totalCountResult[0].count;

    const results = await this.db
      .select({
        id: loans.id,
        loanType: loanTypes.name,
        interestRate: loanTypes.interestRate,
        loanAmount: loans.requestedAmount,
        outstandingBalance:
          schema.loanOutstandingBalance.outstandingTotalBalance,
        installmentAmount: loans.installmentAmount,
        requestDate: loans.requestDate,
        terms: loanTypes.termUnits,
        status: loans.status,
      })
      .from(loans)
      .leftJoin(loanTypes, eq(loans.loanTypeId, loanTypes.id))
      .leftJoin(
        schema.loanOutstandingBalance,
        eq(loans.id, schema.loanOutstandingBalance.loanId),
      )
      .where(
        and(eq(loans.tenantId, tenantId), eq(loans.associateId, associateId)),
      )
      .orderBy(desc(loans.requestDate))
      .limit(limit)
      .offset((page - 1) * limit);

    if (!results.length) {
      return {
        data: [],
        meta: {
          totalCount: 0,
          page: 1,
          limit,
          totalPages: 0,
        },
      };
    }

    const loansWithProgress = results.map((loan) => {
      const totalAmount = parseFloat(loan.loanAmount || '0');
      const outstanding = parseFloat(loan.outstandingBalance || '0');

      let progress = 0;
      if (totalAmount > 0) {
        const paidAmount = totalAmount - outstanding;
        progress = (paidAmount / totalAmount) * 10;
      }

      const formattedProgress = Math.max(0, Math.min(10, progress)).toFixed(2);

      return {
        ...loan,
        loanAmount: totalAmount.toFixed(2),
        outstandingBalance: outstanding.toFixed(2),
        installmentAmount: parseFloat(loan.installmentAmount || '0').toFixed(2),
        progress: formattedProgress,
      };
    });

    return {
      data: loansWithProgress,
      meta: {
        totalCount: Number(totalCount),
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  // ─── DETALLE COMPLETO DE PRÉSTAMO ──────────────────────────────────────

  async findLoanDetails(id: string, tenantId: string) {
    const [loan] = await this.db
      .select({
        id: loans.id,
        associateId: loans.associateId,
        loanTypeId: loans.loanTypeId,
        loanModality: loans.loanModality,
        requestDate: loans.requestDate,
        approvalDate: loans.approvalDate,
        disbursementDate: loans.disbursementDate,
        requestedAmount: loans.requestedAmount,
        approvedAmount: loans.approvedAmount,
        disbursedAmount: loans.disbursedAmount,
        startDate: loans.startDate,
        endDate: loans.endDate,
        totalInterest: loans.totalInterest,
        installmentAmount: loans.installmentAmount,
        totalPayable: loans.totalPayable,
        expensesAmount: loans.expensesAmount,
        overdraftAmount: loans.overdraftAmount,
        previousLoanId: loans.previousLoanId,
        paymentMethod: loans.paymentMethod,
        disbursementAccountId: loans.disbursementAccountId,
        status: loans.status,
        rejectionReason: loans.rejectionReason,
        approvedByUserId: loans.approvedByUserId,
        disbursedByUserId: loans.disbursedByUserId,
        notes: loans.notes,
        customReference: loans.customReference,
        currencyCode: loans.currencyCode,
        exchangeRateId: loans.exchangeRateId,
        balanceInFavor: loans.balanceInFavor,
        createdAt: loans.createdAt,
        updatedAt: loans.updatedAt,
        createdBy: loans.createdById,
        updatedBy: loans.updatedById,
        associateName: associates.fullname,
        associateCedula: associates.cedula,
        loanTypeName: loanTypes.name,
      })
      .from(loans)
      .where(and(eq(loans.id, id), eq(loans.tenantId, tenantId)))
      .leftJoin(associates, eq(loans.associateId, associates.id))
      .leftJoin(loanTypes, eq(loans.loanTypeId, loanTypes.id));

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    const amortizationSchedule = await this.db
      .select()
      .from(loanAmortizationSchedule)
      .where(eq(loanAmortizationSchedule.loanId, id))
      .orderBy(loanAmortizationSchedule.installmentNumber);

    const statusHistory = await this.db
      .select()
      .from(loanStatusHistory)
      .where(eq(loanStatusHistory.loanId, id))
      .orderBy(desc(loanStatusHistory.changedAt));

    const totalPaid = amortizationSchedule
      .filter((item) => item.paymentStatus === 'PAID')
      .reduce((acc, item) => acc + parseFloat(item.paidAmount || '0'), 0);

    const totalPending = Number(loan.totalPayable || 0) - Number(totalPaid);

    return {
      loan,
      amortizationSchedule,
      statusHistory,
      summary: {
        totalPaid,
        totalPending,
        paidInstallments: amortizationSchedule.filter(
          (item) => item.paymentStatus === 'PAID',
        ).length,
        pendingInstallments: amortizationSchedule.filter(
          (item) => item.paymentStatus === 'PENDING',
        ).length,
      },
    };
  }
}
