import { PaginationDto } from '@/common/dto/pagination.dto';
import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  associateAccounts,
  associates,
  credits,
  creditAmortizationSchedule,
  creditItemSales,
  creditStatusHistory,
  creditsTypes,
  loans,
  withdrawalTypes,
} from '@/database/schema/tables/savings';
import { exchangeRates, moduleSettings } from '@/database/schema/tables/core';
import { suppliers } from '@/database/schema/tables/purchasing';
import { products, productPrices } from '@/database/schema/tables/inventory';
import { associateHaberesBalance } from '@/database/schema/views';
import { InventoryMovementsService } from '@/features/inventory/inventory-movements/inventory-movements.service';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import { WithdrawalAssociateService } from '@/features/savings/withdrawalls/withdrawal-associate/withdrawal-associate.service';
import { AuditHelper } from '@/features/audit/audit-event.service';
import {
  AssociateMovementTypeEnum,
  BankTransactionCategory,
  creditModalityTypeEnum,
  CreditStatusEnum,
  CurrencyCodeEnum,
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
import { AssociateAccountsMovementsService } from '../../parnerts/associate-accounts-movements/associate-accounts-movements.service';
import {
  CreateCreditDto,
  CreditItemDto,
  FilterCreditDto,
} from './dto/credit.schema';

@Injectable()
export class CreditManagementService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly generateCodeService: GenerateCodeService,
    private readonly inventoryMovementsService: InventoryMovementsService,
    private readonly withdrawalAssociateService: WithdrawalAssociateService,
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
    creditAmount: number,
    numInstallments: number,
    annualInterestRate: number,
    startDate: Date,
    creditId: string,
    createdById: string,
    termType: 'installments' | 'quotas',
    expensesAmount: number,
  ) {
    const periodsPerYear = termType === 'installments' ? 24 : 12;
    const r = annualInterestRate / 100 / periodsPerYear;
    const n = numInstallments;
    const factor = r === 0 ? 1 : Math.pow(1 + r, n);
    const frenchInstallment = r === 0
      ? creditAmount / n
      : (creditAmount * r * factor) / (factor - 1);
    const expensePerInstallment = expensesAmount / n;
    const totalInstallmentAmount = frenchInstallment + expensePerInstallment;

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
    let remaining = creditAmount;

    for (let i = 1; i <= n; i++) {
      const interestThisPeriod = remaining * r;
      let principalThisPeriod = frenchInstallment - interestThisPeriod;
      let expenseComponent = expensePerInstallment;
      let total = totalInstallmentAmount;

      if (i === n) {
        principalThisPeriod = remaining;
        total = principalThisPeriod + interestThisPeriod + expenseComponent;
      }

      remaining -= principalThisPeriod;

      schedule.push({
        creditId,
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

  async searchAssociate(tenantId: string | null, cedula: string) {
    const conditions: SQL<unknown>[] = [eq(associates.cedula, cedula)];
    if (tenantId) {
      conditions.push(eq(associates.tenantId, tenantId));
    }

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
      .where(and(...conditions));

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
        lastWithdrawalDate: null,
        baseSalary: Number(assoc.baseSalary ?? 0),
        paymentCapacity: 0,
      };
    }

    const activeLoans = await this.db
      .select({ id: loans.id })
      .from(loans)
      .where(
        and(
          tenantId ? eq(loans.tenantId, tenantId) : undefined,
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
      .select({ id: credits.id })
      .from(credits)
      .where(
        and(
          eq(credits.associateId, assoc.id),
          tenantId ? eq(credits.tenantId, tenantId) : undefined,
          or(
            eq(credits.status, CreditStatusEnum.REQUESTED),
            eq(credits.status, CreditStatusEnum.APPROVED),
            eq(credits.status, CreditStatusEnum.IN_PAYMENT),
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
      lastWithdrawalDate: null,
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
    const schedule = this.generateAmortizationSchedule(
      params.amount,
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
        creditId: undefined,
        createdById: undefined,
        dueDate: (s.dueDate as Date).toISOString(),
      })),
      monthlyPayment: schedule[0]?.totalInstallmentAmount || '0',
    };
  }

  // ─── LISTAR TIPOS DE CRÉDITO ────────────────────────────────────────────

  async listCreditTypes(tenantId: string | null) {
    const conditions: SQL<unknown>[] = [];
    if (tenantId) {
      conditions.push(eq(creditsTypes.tenantId, tenantId));
    }
    return this.db
      .select()
      .from(creditsTypes)
      .where(conditions.length ? and(...conditions) : undefined);
  }

  // ─── LISTAR BANCOS ──────────────────────────────────────────────────────

  async listBankAccounts(tenantId: string | null) {
    const conditions: SQL<unknown>[] = [];
    if (tenantId) {
      conditions.push(eq(schema.bankAccounts.tenantId, tenantId));
    }
    return this.db
      .select({
        id: schema.bankAccounts.id,
        accountNumber: schema.bankAccounts.accountNumber,
        accountName: schema.bankAccounts.accountName,
        bankDirectoryId: schema.bankAccounts.bankDirectoryId,
        currencyCode: schema.bankAccounts.currencyCode,
        isActive: schema.bankAccounts.isActive,
      })
      .from(schema.bankAccounts)
      .where(conditions.length ? and(...conditions) : undefined);
  }

  // ─── LISTAR PROVEEDORES ─────────────────────────────────────────────────

  async listSuppliers(tenantId: string | null) {
    const conditions: SQL<unknown>[] = [];
    if (tenantId) {
      conditions.push(eq(suppliers.tenantId, tenantId));
    }
    return this.db
      .select()
      .from(suppliers)
      .where(conditions.length ? and(...conditions) : undefined);
  }

  // ─── LISTAR PRODUCTOS ───────────────────────────────────────────────────

  async listProducts(tenantId: string | null) {
    const conditions: SQL<unknown>[] = [];
    if (tenantId) {
      conditions.push(eq(products.tenantId, tenantId));
    }
    return this.db
      .select()
      .from(products)
      .where(conditions.length ? and(...conditions) : undefined);
  }

  // ─── SOLICITAR CRÉDITO ──────────────────────────────────────────────────

  async request(
    tenantId: string,
    userId: string,
    dto: CreateCreditDto,
  ): Promise<{ id: string; customReference: string | null }> {
    const {
      associateId,
      requestedAmount,
      creditTypeId,
      startDate,
      interestRate,
      termType,
      termUnits,
      expensesPercentage,
      allowOverdraft,
      haberesPayment,
      directPayment,
    } = dto;

    const [creditType] = await this.db
      .select()
      .from(creditsTypes)
      .where(
        and(
          eq(creditsTypes.id, creditTypeId),
          eq(creditsTypes.tenantId, tenantId),
        ),
      );

    if (!creditType) {
      throw new NotFoundException('Tipo de crédito no encontrado');
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
        'El asociado tiene credinomina activo, no puede solicitar créditos',
      );
    }

    if (creditType.minCreditAmount && Number(creditType.minCreditAmount) > 0 && requestedAmount < Number(creditType.minCreditAmount)) {
      throw new BadRequestException(
        `El monto mínimo para este tipo de crédito es ${Number(creditType.minCreditAmount).toLocaleString('es')}`,
      );
    }
    if (creditType.maxCreditAmount && Number(creditType.maxCreditAmount) > 0 && requestedAmount > Number(creditType.maxCreditAmount)) {
      throw new BadRequestException(
        `El monto máximo para este tipo de crédito es ${Number(creditType.maxCreditAmount).toLocaleString('es')}`,
      );
    }

    const activeCreditStatuses: CreditStatusEnum[] = [
      CreditStatusEnum.REQUESTED,
      CreditStatusEnum.APPROVED,
      CreditStatusEnum.IN_PAYMENT,
    ];

    const existingCredits = await this.db
      .select({ id: credits.id })
      .from(credits)
      .where(
        and(
          eq(credits.tenantId, tenantId),
          eq(credits.associateId, associateId),
          or(
            eq(credits.status, CreditStatusEnum.REQUESTED),
            eq(credits.status, CreditStatusEnum.APPROVED),
            eq(credits.status, CreditStatusEnum.IN_PAYMENT),
          ),
        ),
      );

    if (existingCredits.length > 0) {
      throw new BadRequestException(
        'El asociado ya tiene un crédito en proceso o activo',
      );
    }

    const activeLoans = await this.db
      .select({ id: loans.id })
      .from(loans)
      .where(
        and(
          eq(loans.tenantId, tenantId),
          eq(loans.associateId, associateId),
          or(
            eq(loans.status, LoanStatusEnum.APPROVED),
            eq(loans.status, LoanStatusEnum.DISBURSED),
            eq(loans.status, LoanStatusEnum.IN_PAYMENT),
            eq(loans.status, LoanStatusEnum.OVERDUE),
          ),
        ),
      );

    if (activeLoans.length > 0) {
      throw new BadRequestException(
        'El asociado tiene un préstamo activo, no puede solicitar créditos',
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

    if (!allowOverdraft && requestedAmount > available80) {
      throw new BadRequestException(
        `El monto solicitado (${requestedAmount.toLocaleString('es')}) supera el 80% disponible (${available80.toLocaleString('es')})`,
      );
    }

    const haberesPaymentAmount = haberesPayment ?? 0;
    const directPaymentAmount = directPayment ?? 0;
    const amortizableAmount = requestedAmount - haberesPaymentAmount - directPaymentAmount;

    if (amortizableAmount < 0) {
      throw new BadRequestException(
        'La suma de pago de haberes y pago directo no puede exceder el monto del crédito',
      );
    }

    const finalRate = interestRate ?? Number(creditType.interestRate);
    const finalTermUnits = termUnits ?? creditType.termUnits;
    const finalTermType = (termType ?? creditType.termType) as 'installments' | 'quotas';
    const expensePct = expensesPercentage ?? Number(creditType.administrativeExpensePercentage ?? 0);

    if (amortizableAmount > 0) {
      const monthlyPayment = this.calculateMonthlyPayment(
        amortizableAmount,
        finalRate,
        finalTermUnits,
        finalTermType,
      );
      const paymentCapacity = (Number(assoc.baseSalary ?? 0)) * 0.3;
      if (monthlyPayment > paymentCapacity) {
        throw new BadRequestException(
          `La cuota mensual (${monthlyPayment.toLocaleString('es', { minimumFractionDigits: 2 })}) supera su capacidad de pago del 30% (${paymentCapacity.toLocaleString('es', { minimumFractionDigits: 2 })})`,
        );
      }
    }

    const dup = await this.db
      .select()
      .from(credits)
      .where(
        and(
          eq(credits.tenantId, tenantId),
          eq(credits.associateId, associateId),
          eq(credits.requestedAmount, String(requestedAmount)),
          eq(credits.creditTypeId, creditTypeId),
          eq(credits.status, CreditStatusEnum.REQUESTED),
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
    const capital = Math.max(amortizableAmount, 0);
    const expensesAmount = capital > 0
      ? (capital * expensePct) / 100
      : 0;

    // Cálculos financieros con Sistema Francés
    const periodsPerYear = finalTermType === 'installments' ? 24 : 12;
    const r = finalRate / 100 / periodsPerYear;
    const factor = r === 0 ? 1 : Math.pow(1 + r, finalTermUnits);
    const frenchInstallment = capital > 0
      ? (capital * r * factor) / (factor - 1)
      : 0;
    const totalInterest = frenchInstallment * finalTermUnits - capital;
    const totalPayable = frenchInstallment * finalTermUnits + expensesAmount;
    const installmentAmount = capital > 0
      ? frenchInstallment + expensesAmount / finalTermUnits
      : 0;

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

    const newCredit = await this.db.transaction(async (tx) => {
      const [ins] = await tx
        .insert(credits)
        .values({
          tenantId,
          associateId: dto.associateId,
          creditTypeId: dto.creditTypeId,
          creditModality: dto.creditModality,
          requestedAmount: String(requestedAmount),
          status: CreditStatusEnum.REQUESTED,
          startDate: startDate.toISOString(),
          requestDate: dto.requestDate.toISOString(),
          endDate: endDate.toISOString(),
          overdraftAmount: dto.overdraftAmount
            ? String(dto.overdraftAmount)
            : null,
          commercialHouseId: dto.commercialHouseId ?? null,
          currencyCode,
          termType: finalTermType,
          termUnits: finalTermUnits,
          interestRate: String(finalRate),
          installmentAmount: String(installmentAmount.toFixed(6)),
          totalInterest: String(totalInterest.toFixed(6)),
          totalPayable: String(totalPayable.toFixed(6)),
          expensesAmount: String(expensesAmount.toFixed(6)),
          notes: dto.notes ?? null,
          invoiceNumber: dto.invoiceNumber ?? null,
          previousCreditId: dto.previousCreditId ?? null,
          allowOverdraft: dto.allowOverdraft ?? false,
          haberesPayment: dto.haberesPayment ? String(dto.haberesPayment) : null,
          directPayment: dto.directPayment ? String(dto.directPayment) : null,
          directPaymentMethod: dto.directPaymentMethod ?? null,
          directPaymentReference: dto.directPaymentReference ?? null,
          directPaymentBankAccountId: dto.directPaymentBankAccountId ?? null,
          createdById: userId,
          updatedById: userId,
        })
        .returning({
          id: credits.id,
          customReference: credits.customReference,
        });

      if (schedule.length > 0) {
        const scheduleRows = schedule.map((s: any) => ({
          ...s,
          creditId: ins.id,
          dueDate: (s.dueDate as Date).toISOString(),
        }));
        await tx.insert(creditAmortizationSchedule).values(scheduleRows);
      }

      await tx.insert(creditStatusHistory).values({
        creditId: ins.id,
        status: CreditStatusEnum.REQUESTED,
        changedByUserId: userId,
        comment: 'CREDIT REQUESTED',
      });

      if (dto?.creditItems && dto?.creditItems.length > 0) {
        await tx.insert(creditItemSales).values(
          dto.creditItems.map((item: CreditItemDto) => ({
            tenantId,
            creditId: ins.id,
            itemId: item.itemId ?? null,
            itemDescription: item.itemDescription ?? null,
            agreedSellingPrice: String(item.agreedSellingPrice),
            quantity: Number(item.quantity),
            itemType: item.itemType as 'PRODUCT' | 'SERVICE' | 'EXTERNAL',
            deliveryStatus: 'ENTREGADO',
            saleDate: item.saleDate.toISOString(),
            days: item.days ? String(item.days) : null,
          })),
        );
      }

      return ins;
    });

    await this.auditHelper.logCreate(userId, 'credit', newCredit, {
      tenantId,
      targetId: newCredit.id,
      description: `Credit requested for associate ${associateId}`,
    });

    return { id: newCredit.id, customReference: newCredit.customReference };
  }

  // ─── APROBAR CRÉDITO ───────────────────────────────────────────────────

  async approve(
    tenantId: string,
    userId: string,
    id: string,
  ): Promise<{ id: string; customReference: string | null }> {
    const [credit] = await this.db
      .select()
      .from(credits)
      .where(and(eq(credits.id, id), eq(credits.tenantId, tenantId)));

    if (!credit) throw new NotFoundException('Crédito no encontrado');
    if (credit.status !== CreditStatusEnum.REQUESTED)
      throw new BadRequestException(
        'Solo se pueden aprobar créditos en estado REQUESTED',
      );

    const {
      associateId,
      requestedAmount,
      creditTypeId,
      startDate,
      currencyCode,
      allowOverdraft,
      haberesPayment,
      directPayment,
      directPaymentMethod,
      directPaymentReference,
      directPaymentBankAccountId,
    } = credit;

    const active = await this.db
      .select()
      .from(credits)
      .where(
        and(
          eq(credits.tenantId, tenantId),
          eq(credits.associateId, associateId),
          eq(credits.status, CreditStatusEnum.APPROVED),
          ne(credits.id, id),
        ),
      );
    if (active.length)
      throw new BadRequestException('El asociado ya tiene un crédito aprobado');

    const [assoc] = await this.db
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

    if (!allowOverdraft) {
      const avail = (Number(assoc?.balance ?? 0)) * 0.8;
      if (Number(avail) < Number(requestedAmount))
        throw new BadRequestException('Disponibilidad insuficiente');
    }

    const creditSale = await this.db
      .select()
      .from(creditItemSales)
      .where(eq(creditItemSales.creditId, id));

    const customReference =
      await this.generateCodeService.generateNextReference(
        'CRE',
        tenantId,
        'portfolio',
        'credits',
      );

    const result = await this.db.transaction(async (tx) => {
      const [updatedCredit] = await tx
        .update(credits)
        .set({
          status: CreditStatusEnum.APPROVED,
          approvalDate: new Date().toISOString(),
          customReference,
          approvedByUserId: userId,
          updatedById: userId,
        })
        .where(eq(credits.id, id))
        .returning({
          id: credits.id,
          customReference: credits.customReference,
        });

      // Si no existe schedule, generarlo
      const existingSchedule = await tx
        .select()
        .from(creditAmortizationSchedule)
        .where(eq(creditAmortizationSchedule.creditId, id));

      if (existingSchedule.length === 0) {
        const finalRate = Number(credit.interestRate ?? 0);
        const finalTermUnits = credit.termUnits ?? 1;
        const finalTermType = (credit.termType ?? 'Plazos') as
          | 'installments'
          | 'quotas';
        const expensesAmount = Number(credit.expensesAmount ?? 0);
        const haberesAmt = Number(haberesPayment ?? 0);
        const directAmt = Number(directPayment ?? 0);
        const amortizableAmount = Math.max(
          0,
          Number(requestedAmount) - haberesAmt - directAmt,
        );

        const schedule =
          amortizableAmount > 0
            ? this.generateAmortizationSchedule(
              amortizableAmount,
              finalTermUnits,
              finalRate,
              startDate ? new Date(startDate) : new Date(),
              id,
              userId,
              finalTermType,
              expensesAmount,
            )
            : [];

        if (schedule.length > 0) {
          await tx.insert(creditAmortizationSchedule).values(
            schedule.map((s: any) => ({
              ...s,
              dueDate: (s.dueDate as Date).toISOString(),
            })),
          );
        }
      }

      await tx.insert(creditStatusHistory).values({
        creditId: id,
        status: CreditStatusEnum.APPROVED,
        changedByUserId: userId,
        comment: 'CREDIT APPROVED',
      });

      // Procesar items de inventario (productos)
      for (const item of creditSale) {
        if (item.itemType === 'PRODUCT' && item.itemId) {
          const [productPrice] = await this.db
            .select({ totalCost: productPrices.totalCost })
            .from(productPrices)
            .where(
              and(
                eq(productPrices.productId, item.itemId),
                eq(productPrices.isActive, true),
                eq(productPrices.priceType, 'SELLING'),
              ),
            )
            .limit(1);

          const unitCost = Number(productPrice?.totalCost ?? item.agreedSellingPrice ?? 0);

          await this.inventoryMovementsService.create(
            {
              movementType: 'STOCK_DELIVERY',
              description: `Salida de producto por crédito asociado N° ${customReference}`,
              associateId: credit.associateId,
              creditId: id,
              items: [
                {
                  productId: String(item.itemId),
                  quantity: item.quantity,
                  unitCost,
                },
              ],
            },
            tenantId,
            userId,
          );
        }
      }

      // ─── Haberes Payment: crear y aprobar retiro ───
      const haberesAmt = Number(haberesPayment ?? 0);
      // if (haberesAmt > 0 && assoc?.associateAccountId) {
      //   const withdrawalTypeForCredit = await this.db.query.withdrawalTypes.findFirst({
      //     where: and(
      //       eq(withdrawalTypes.tenantId, tenantId),
      //       eq(withdrawalTypes.withdrawalPercentage, '80'),
      //       eq(withdrawalTypes.isHouseComercial, false),
      //       eq(withdrawalTypes.isInternalInventory, false),
      //     ),
      //   });

      //   if (withdrawalTypeForCredit) {
      //     await this.withdrawalAssociateService.execute(tenantId, userId, {
      //       associateAccountId: assoc.associateAccountId,
      //       withdrawalTypeId: withdrawalTypeForCredit.id,
      //       requestedAmount: haberesAmt,
      //       paymentMethod: paymentMethodEnum.BANK_TRANSFER,
      //       date: new Date(),
      //       description: `Retiro haberes por Crédito N°${customReference}`,
      //       commercialHouseId: null,
      //     });
      //   }
      // }

      // ─── Direct Payment: crear movimiento bancario ───
      const directAmt = Number(directPayment ?? 0);
      if (directAmt > 0 && directPaymentBankAccountId) {
        const methodMap: Record<string, paymentMethodEnum> = {
          transfer: paymentMethodEnum.BANK_TRANSFER,
          deposit: paymentMethodEnum.DEPOSIT,
          pago_movil: paymentMethodEnum.MOBILE_PAYMENT,
          check: paymentMethodEnum.CHECK,
          cash: paymentMethodEnum.CASH,
        };
        const paymentMethod = methodMap[directPaymentMethod as string] ?? paymentMethodEnum.BANK_TRANSFER;

        await this.bankMovementsService.createAndReconcile(
          {
            movement: {
              bankAccountId: directPaymentBankAccountId,
              transactionDate: new Date(),
              paymentMethod,
              description: `Pago directo inicial Crédito N°${customReference}`,
              bankReference: directPaymentReference ?? undefined,
              category: 'CREDIT_DISBURSEMENT' as BankTransactionCategory,
              creditAmount: directAmt,
              debitAmount: 0,
            },
            links: [
              {
                internalRecordType: 'CREDIT_DISBURSEMENT',
                internalRecordId: id,
              },
            ],
          },
          userId,
          tenantId,
        );
      }

      // Movimiento de cuenta del asociado
      if (assoc?.associateAccountId) {
        const movementAmount = Number(requestedAmount);
        const movementType: AssociateMovementTypeEnum =
          credit.creditModality === 'SPECIAL_QUOTAS'
            ? AssociateMovementTypeEnum.SPECIAL_CREDIT_DISBURSEMENT_CREDIT
            : AssociateMovementTypeEnum.COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT;

        // Haberes payment: retiro de haberes para pagar parte del crédito
        const haberesAmt = Number(haberesPayment ?? 0);
        if (haberesAmt > 0) {
          await this.associateAccountsMovementsService.create(
            userId,
            {
              associateAccountId: assoc.associateAccountId,
              movementType: AssociateMovementTypeEnum.SAVING_WITHDRAWAL,
              amount: haberesAmt,
              currencyCode: currencyCode as CurrencyCodeEnum,
              transactionDate: new Date(),
              description: `Abono desde haberes para Crédito N°${customReference}`,
              referenceId: String(id),
              referenceType: 'credits',
            },
            tenantId,
          );
        }

        // Direct payment: pago recibido como inicial/abono directo
        const directAmt = Number(directPayment ?? 0);
        if (directAmt > 0) {
          await this.associateAccountsMovementsService.create(
            userId,
            {
              associateAccountId: assoc.associateAccountId,
              movementType: AssociateMovementTypeEnum.COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT,
              amount: directAmt,
              currencyCode: currencyCode as CurrencyCodeEnum,
              transactionDate: new Date(),
              description: `Pago directo inicial Crédito N°${customReference}`,
              referenceId: String(id),
              referenceType: 'credits',
            },
            tenantId,
          );
        }

        await this.associateAccountsMovementsService.create(
          userId,
          {
            associateAccountId: assoc.associateAccountId,
            movementType,
            amount: movementAmount,
            currencyCode: currencyCode as CurrencyCodeEnum,
            transactionDate: new Date(),
            description: `Crédito Aprobado N°${customReference}`,
            referenceId: String(id),
            referenceType: 'credits',
          },
          tenantId,
        );

        const expensesAmount = Number(credit.expensesAmount ?? 0);
        if (expensesAmount > 0) {
          await this.associateAccountsMovementsService.create(
            userId,
            {
              associateAccountId: assoc.associateAccountId,
              movementType: AssociateMovementTypeEnum.CREDIT_ADMIN_FEE_DEBIT,
              amount: expensesAmount,
              currencyCode: currencyCode as CurrencyCodeEnum,
              transactionDate: new Date(),
              description: `Gastos Administrativos Crédito N°${customReference}`,
              referenceId: String(id),
              referenceType: 'credits',
            },
            tenantId,
          );
        }
      }

      await this.auditHelper.logUpdate(userId, 'credit', credit, updatedCredit, {
        tenantId,
        targetId: id,
        description: `Crédito Aprobado N°${customReference}`,
      });

      return updatedCredit;
    });

    return { id: result.id, customReference: result.customReference ?? null };
  }

  // ─── LISTAR TODOS (PAGINADO) ────────────────────────────────────────────

  async findAll(tenantId: string | null, paginationDto: FilterCreditDto) {
    const {
      page = 1,
      limit = 10,
      searchType = '',
      search = '',
      sortBy = 'id',
      sortOrder = 'desc',
      status = '',
      type = '',
      modality = '',
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [];

    if (tenantId) {
      searchConditions.push(eq(credits.tenantId, tenantId));
    }

    if (search) {
      switch (searchType) {
        case 'cedula':
          searchConditions.push(ilike(associates.cedula, `%${search}%`));
          break;
        case 'fullname':
          searchConditions.push(
            ilike(associates.fullname, `%${search}%`),
          );
          break;
      }
    }

    if (status) {
      searchConditions.push(
        eq(credits.status, status as CreditStatusEnum),
      );
    }

    if (type) {
      searchConditions.push(eq(credits.creditTypeId, type));
    }

    if (modality) {
      searchConditions.push(
        eq(credits.creditModality, modality as creditModalityTypeEnum),
      );
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderByColumn = credits[sortBy as keyof typeof credits];
    const orderBy =
      sortOrder === 'asc'
        ? sql`${orderByColumn} asc`
        : sql`${orderByColumn} desc`;

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(credits)
      .leftJoin(associates, eq(credits.associateId, associates.id))
      .leftJoin(creditsTypes, eq(credits.creditTypeId, creditsTypes.id))
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select({
        id: credits.id,
        associateId: credits.associateId,
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
        creditTypeId: credits.creditTypeId,
        creditModality: credits.creditModality,
        creditTypeName: creditsTypes.name,
        creditTypeInterestRate: creditsTypes.interestRate,
        creditTypeAdministrativeExpensePercentage:
          creditsTypes.administrativeExpensePercentage,
        creditTypeTermUnits: creditsTypes.termUnits,
        requestDate: credits.requestDate,
        approvalDate: credits.approvalDate,
        requestedAmount: credits.requestedAmount,
        startDate: credits.startDate,
        endDate: credits.endDate,
        totalInterest: credits.totalInterest,
        installmentAmount: credits.installmentAmount,
        totalPayable: credits.totalPayable,
        expensesAmount: credits.expensesAmount,
        overdraftAmount: credits.overdraftAmount,
        previousCreditId: credits.previousCreditId,
        status: credits.status,
        approvedByUserId: credits.approvedByUserId,
        notes: credits.notes,
        customReference: credits.customReference,
        currencyCode: credits.currencyCode,
        exchangeRateId: credits.exchangeRateId,
        invoiceNumber: credits.invoiceNumber,
        termType: credits.termType,
        termUnits: credits.termUnits,
        interestRate: credits.interestRate,
        haberesPayment: credits.haberesPayment,
        directPayment: credits.directPayment,
      })
      .from(credits)
      .where(searchCondition)
      .orderBy(orderBy)
      .leftJoin(associates, eq(credits.associateId, associates.id))
      .leftJoin(creditsTypes, eq(credits.creditTypeId, creditsTypes.id))
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
      data: data.map((credit) => ({
        ...credit,
        requestedAmount: Number(credit.requestedAmount).toFixed(2),
        installmentAmount: credit.installmentAmount
          ? Number(credit.installmentAmount).toFixed(2)
          : null,
        totalInterest: credit.totalInterest
          ? Number(credit.totalInterest).toFixed(2)
          : null,
        totalPayable: credit.totalPayable
          ? Number(credit.totalPayable).toFixed(2)
          : null,
        expensesAmount: credit.expensesAmount
          ? Number(credit.expensesAmount).toFixed(2)
          : null,
        haberesPayment: credit.haberesPayment
          ? Number(credit.haberesPayment).toFixed(2)
          : null,
        directPayment: credit.directPayment
          ? Number(credit.directPayment).toFixed(2)
          : null,
      })),
      meta,
    };
  }

  async findRequestByEdit(tenantId: string | null, id: string) {
    const conditions: SQL<unknown>[] = [eq(credits.id, id)];
    if (tenantId) {
      conditions.push(eq(credits.tenantId, tenantId));
    }

    const [data] = await this.db
      .select({
        id: credits.id,
        associateId: credits.associateId,
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
        associatePhone: associates.phone,
        associateEmail: associates.email,
        associateDateAdmission: associates.dateAdmission,
        associateIsPayrollCredit: associates.isPayrollCredit,
        associateAccountId: associateAccounts.id,
        associateAccountNumber: associateAccounts.accountNumber,
        associateBalance: associateAccounts.balance,
        creditTypeId: credits.creditTypeId,
        creditModality: credits.creditModality,
        creditTypeName: creditsTypes.name,
        requestDate: credits.requestDate,
        approvalDate: credits.approvalDate,
        requestedAmount: credits.requestedAmount,
        startDate: credits.startDate,
        endDate: credits.endDate,
        totalInterest: credits.totalInterest,
        installmentAmount: credits.installmentAmount,
        totalPayable: credits.totalPayable,
        expensesAmount: credits.expensesAmount,
        overdraftAmount: credits.overdraftAmount,
        previousCreditId: credits.previousCreditId,
        status: credits.status,
        rejectionReason: credits.rejectionReason,
        approvedByUserId: credits.approvedByUserId,
        notes: credits.notes,
        customReference: credits.customReference,
        currencyCode: credits.currencyCode,
        exchangeRateId: credits.exchangeRateId,
        invoiceNumber: credits.invoiceNumber,
        commercialHouseId: credits.commercialHouseId,
        termType: credits.termType,
        termUnits: credits.termUnits,
        interestRate: credits.interestRate,
      })
      .from(credits)
      .where(and(...conditions))
      .leftJoin(associates, eq(credits.associateId, associates.id))
      .leftJoin(
        associateAccounts,
        eq(credits.associateId, associateAccounts.associateId),
      )
      .leftJoin(creditsTypes, eq(credits.creditTypeId, creditsTypes.id));

    if (!data) {
      throw new NotFoundException('Crédito no encontrado');
    }

    const [{ count: total }] = await this.db
      .select({ count: count() })
      .from(credits)
      .where(
        and(
          eq(credits.associateId, data.associateId),
          ne(credits.status, CreditStatusEnum.PAID),
        ),
      );

    return { ...data, totalCredits: total };
  }

  // ─── BUSCAR ASOCIADO POR CÉDULA ────────────────────────────────────────

  async findOneRequest(tenantId: string | null, cedula: string) {
    const conditions: SQL<unknown>[] = [eq(associates.cedula, cedula)];
    if (tenantId) {
      conditions.push(eq(associates.tenantId, tenantId));
    }

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
      })
      .from(associates)
      .where(and(...conditions));

    if (!associate) {
      throw new NotFoundException(
        `Asociado con cédula ${cedula} no encontrado`,
      );
    }
    if (associate.status === 'INACTIVE') {
      throw new NotFoundException(
        `Asociado con cédula ${cedula} está inactivo`,
      );
    }
    if (associate.status === 'RETIRED') {
      throw new NotFoundException(
        `Asociado con cédula ${cedula} está retirado`,
      );
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
        eq(
          associateHaberesBalance.associateAccountId,
          associateAccounts.id,
        ),
      )
      .where(eq(associateAccounts.associateId, associate.id));

    const [{ count: total }] = await this.db
      .select({ count: count() })
      .from(credits)
      .where(
        and(
          eq(credits.associateId, associate.id),
          ne(credits.status, CreditStatusEnum.PAID),
          ne(credits.status, CreditStatusEnum.REQUESTED),
        ),
      );

    const [{ count: totalLoans }] = await this.db
      .select({ count: count() })
      .from(loans)
      .where(
        and(
          eq(loans.associateId, associate.id),
          ne(loans.status, LoanStatusEnum.PAID),
          ne(loans.status, LoanStatusEnum.REQUESTED),
          ne(loans.status, LoanStatusEnum.CANCELLED),
          ne(loans.status, LoanStatusEnum.REJECTED),
        ),
      );

    return {
      associate: {
        ...associate,
        associateAccountId:
          associateAccount?.associateAccountId,
        accountNumber: associateAccount?.accountNumber,
        balance: Number(associateAccount?.balance ?? 0).toFixed(2),
      },
      totalCredits: total,
      totalLoans: totalLoans,
    };
  }

  // ─── ENCONTRAR UNO ─────────────────────────────────────────────────────

  async findOne(tenantId: string | null, id: string) {
    const conditions: SQL<unknown>[] = [eq(credits.id, id)];
    if (tenantId) {
      conditions.push(eq(credits.tenantId, tenantId));
    }

    const [credit] = await this.db
      .select()
      .from(credits)
      .where(and(...conditions));

    if (!credit) {
      throw new NotFoundException('Crédito no encontrado');
    }

    return credit;
  }

  // ─── ELIMINAR ──────────────────────────────────────────────────────────

  async remove(
    tenantId: string | null,
    userId: string,
    id: string,
  ): Promise<{ message: string }> {
    const conditions: SQL<unknown>[] = [eq(credits.id, id)];
    if (tenantId) {
      conditions.push(eq(credits.tenantId, tenantId));
    }

    const [existingCredit] = await this.db
      .select()
      .from(credits)
      .where(and(...conditions));

    if (!existingCredit) {
      throw new HttpException('Crédito no encontrado', HttpStatus.NOT_FOUND);
    }

    await this.db.transaction(async (tx) => {
      await tx
        .delete(creditAmortizationSchedule)
        .where(eq(creditAmortizationSchedule.creditId, id));

      await tx
        .delete(creditItemSales)
        .where(eq(creditItemSales.creditId, id));

      await tx
        .delete(creditStatusHistory)
        .where(eq(creditStatusHistory.creditId, id));

      await tx.delete(credits).where(and(...conditions));
    });

    await this.auditHelper.logDelete(userId, 'credit', existingCredit, {
      tenantId: tenantId ?? undefined,
      targetId: id,
      description: `Deleted credit ${id}`,
    });

    return { message: 'Crédito eliminado exitosamente' };
  }

  // ─── CONTADOR DE CRÉDITOS ──────────────────────────────────────────────

  async findCountAllCredits(tenantId: string | null) {
    const conditions: SQL<unknown>[] = [];
    if (tenantId) {
      conditions.push(eq(credits.tenantId, tenantId));
    }

    const totalCreditOrdinary = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(credits)
      .where(
        and(
          ...conditions,
          eq(credits.creditModality, creditModalityTypeEnum.ORDINARY),
          or(
            eq(credits.status, CreditStatusEnum.APPROVED),
            eq(credits.status, CreditStatusEnum.IN_PAYMENT),
          ),
        ),
      );

    const totalCreditSpecialQuotas = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(credits)
      .where(
        and(
          ...conditions,
          eq(
            credits.creditModality,
            creditModalityTypeEnum.SPECIAL_QUOTAS,
          ),
          or(eq(credits.status, CreditStatusEnum.APPROVED)),
        ),
      );

    const totalCreditPaid = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(credits)
      .where(and(...conditions, eq(credits.status, CreditStatusEnum.PAID)));

    const totalCreditInPayment = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(credits)
      .where(
        and(...conditions, eq(credits.status, CreditStatusEnum.IN_PAYMENT)),
      );

    return {
      totalCreditOrdinary: Number(totalCreditOrdinary[0].count),
      totalCreditSpecialQuotas: Number(totalCreditSpecialQuotas[0].count),
      totalCreditPaid: Number(totalCreditPaid[0].count),
      totalCreditInPayment: Number(totalCreditInPayment[0].count),
    };
  }

  // ─── CRÉDITOS POR ASOCIADO ─────────────────────────────────────────────

  async findAllByAssociate(
    tenantId: string | null,
    associateId: string,
    filtersDto: PaginationDto,
  ) {
    const { page = 1, limit = 10 } = filtersDto;

    const conditions: SQL<unknown>[] = [
      eq(credits.associateId, associateId),
    ];
    if (tenantId) {
      conditions.push(eq(credits.tenantId, tenantId));
    }

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(credits)
      .leftJoin(creditsTypes, eq(credits.creditTypeId, creditsTypes.id))
      .leftJoin(
        schema.creditOutstandingBalance,
        eq(credits.id, schema.creditOutstandingBalance.creditId),
      )
      .where(and(...conditions));

    const totalCount = Number(totalCountResult[0].count);
    const results = await this.db
      .select({
        id: credits.id,
        creditType: creditsTypes.name,
        interestRate: creditsTypes.interestRate,
        creditAmount: credits.requestedAmount,
        outstandingBalance:
          schema.creditOutstandingBalance.outstandingTotalBalance,
        installmentAmount: credits.installmentAmount,
        requestDate: credits.requestDate,
        terms: creditsTypes.termUnits,
        status: credits.status,
        customReference: credits.customReference,
        termType: credits.termType,
        termUnits: credits.termUnits,
      })
      .from(credits)
      .leftJoin(creditsTypes, eq(credits.creditTypeId, creditsTypes.id))
      .leftJoin(
        schema.creditOutstandingBalance,
        eq(credits.id, schema.creditOutstandingBalance.creditId),
      )
      .where(and(...conditions))
      .orderBy(desc(credits.requestDate));

    if (!results.length) {
      return {
        data: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: limit,
          totalPages: 0,
          currentPage: 1,
        },
      };
    }

    const creditsWithProgress = results.map((credit) => {
      const totalAmount = parseFloat(credit.creditAmount || '0');
      const outstanding = parseFloat(credit.outstandingBalance || '0');

      let progress = 0;
      if (totalAmount > 0) {
        const paidAmount = totalAmount - outstanding;
        progress = (paidAmount / totalAmount) * 10;
      }

      const formattedProgress = Math.max(0, Math.min(10, progress)).toFixed(
        2,
      );

      return {
        ...credit,
        creditAmount: totalAmount.toFixed(2),
        outstandingBalance: outstanding.toFixed(2),
        installmentAmount: parseFloat(
          credit.installmentAmount || '0',
        ).toFixed(2),
        progress: formattedProgress,
      };
    });

    return {
      data: creditsWithProgress,
      meta: {
        totalItems: Number(totalCount),
        itemCount: results.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      },
    };
  }

  // ─── DETALLE COMPLETO DE CRÉDITO ──────────────────────────────────────

  async findCreditDetails(tenantId: string | null, id: string) {
    const conditions: SQL<unknown>[] = [eq(credits.id, id)];
    if (tenantId) {
      conditions.push(eq(credits.tenantId, tenantId));
    }

    const [credit] = await this.db
      .select({
        id: credits.id,
        associateId: credits.associateId,
        creditTypeId: credits.creditTypeId,
        creditModality: credits.creditModality,
        requestDate: credits.requestDate,
        approvalDate: credits.approvalDate,
        requestedAmount: credits.requestedAmount,
        startDate: credits.startDate,
        endDate: credits.endDate,
        totalInterest: credits.totalInterest,
        installmentAmount: credits.installmentAmount,
        totalPayable: credits.totalPayable,
        expensesAmount: credits.expensesAmount,
        overdraftAmount: credits.overdraftAmount,
        previousCreditId: credits.previousCreditId,
        status: credits.status,
        rejectionReason: credits.rejectionReason,
        approvedByUserId: credits.approvedByUserId,
        notes: credits.notes,
        customReference: credits.customReference,
        currencyCode: credits.currencyCode,
        exchangeRateId: credits.exchangeRateId,
        balanceInFavor: credits.balanceInFavor,
        commercialHouseId: credits.commercialHouseId,
        invoiceNumber: credits.invoiceNumber,
        interestRate: credits.interestRate,
        termType: credits.termType,
        termUnits: credits.termUnits,
        haberesPayment: credits.haberesPayment,
        directPayment: credits.directPayment,
        createdAt: credits.createdAt,
        updatedAt: credits.updatedAt,
        createdById: credits.createdById,
        updatedById: credits.updatedById,
        associateName: associates.fullname,
        associateCedula: associates.cedula,
        creditTypeName: creditsTypes.name,
      })
      .from(credits)
      .where(and(...conditions))
      .leftJoin(associates, eq(credits.associateId, associates.id))
      .leftJoin(creditsTypes, eq(credits.creditTypeId, creditsTypes.id));

    if (!credit) {
      throw new NotFoundException('Crédito no encontrado');
    }

    const amortizationSchedule = await this.db
      .select()
      .from(creditAmortizationSchedule)
      .where(eq(creditAmortizationSchedule.creditId, id))
      .orderBy(creditAmortizationSchedule.installmentNumber);

    const statusHistory = await this.db
      .select()
      .from(creditStatusHistory)
      .where(eq(creditStatusHistory.creditId, id))
      .orderBy(desc(creditStatusHistory.changedAt));

    const items = await this.db
      .select({
        id: creditItemSales.id,
        creditId: creditItemSales.creditId,
        itemType: creditItemSales.itemType,
        itemId: creditItemSales.itemId,
        itemDescription: creditItemSales.itemDescription,
        quantity: creditItemSales.quantity,
        agreedSellingPrice: creditItemSales.agreedSellingPrice,
        saleDate: creditItemSales.saleDate,
        deliveryStatus: creditItemSales.deliveryStatus,
        days: creditItemSales.days,
        itemName: products.name,
      })
      .from(creditItemSales)
      .leftJoin(products, eq(products.id, creditItemSales.itemId))
      .where(eq(creditItemSales.creditId, id));

    const totalPaid = amortizationSchedule
      .filter((item) => item.paymentStatus === 'PAID')
      .reduce(
        (acc, item) => acc + parseFloat(item.paidAmount || '0'),
        0,
      );

    const totalPending = Number(credit.totalPayable || '0') - totalPaid;

    return {
      credit,
      amortizationSchedule,
      statusHistory,
      items,
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
