import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  associateAccounts,
  associates,
  exchangeRates,
  loanAmortizationSchedule,
  loans,
  loanStatusHistory,
  loanTypes,
  tenantSettings,
} from '@/database/schema';
import { associateHaberesBalance } from '@/database/schema/views';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import {
  loanModalityTypeEnum,
  LoanStatusEnum,
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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, count, desc, eq, ilike, ne, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  CreateLoanDto,
  FilterLoanDto,
  UpdateLoanDto,
} from './dto/loan-management.schema';

@Injectable()
export class LoanManagementService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private generateAmortizationSchedule(
    loanAmount: number,
    numInstallments: number,
    annualInterestRate: number,
    startDate: Date,
    loanId: string,
    createdById: string,
    termType: 'Plazos' | 'Cuotas' = 'Plazos',
    expensesAmount: number = 0,
  ) {
    const periodsPerYear = termType === 'Plazos' ? 24 : 12;
    const r = annualInterestRate / 100 / periodsPerYear;
    const n = numInstallments;

    const factor = Math.pow(1 + r, n);
    const frenchInstallment = (loanAmount * r * factor) / (factor - 1);

    const totalInterestFixed = frenchInstallment * n - loanAmount;

    const expensePerInstallment = expensesAmount / n;

    const totalInstallmentAmount = frenchInstallment + expensePerInstallment;

    const totalInstallments = n;

    const installmentAmountExact = totalInstallmentAmount;
    const expenseComponentExact = expensePerInstallment;
    let remainingBalanceForSchedule = loanAmount;

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
        const lastDay = getLastDayOfMonth(new Date(targetYear, targetMonth, 1));
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

    let nextDueDate: Date;
    if (termType === 'Plazos') {
      if (startDate.getDate() <= 15) {
        nextDueDate = getNextBiweeklyDueDate(startDate, false);
      } else {
        nextDueDate = getNextBiweeklyDueDate(startDate, true);
      }
    } else {
      nextDueDate = getLastDayOfMonth(startDate);
    }

    const schedule: Array<{
      loanId: string;
      installmentNumber: number;
      dueDate: Date;
      principalAmount: number;
      interestAmount: number;
      totalInstallmentAmount: number;
      principalBalancePending: number;
      paymentStatus: PaymentStatusEnum;
      createdById: string;
    }> = [];

    for (let i = 1; i <= totalInstallments; i++) {
      const interestThisPeriod = remainingBalanceForSchedule * r;
      let principalThisPeriod = frenchInstallment - interestThisPeriod;
      let expenseComponent = expenseComponentExact;
      let total = installmentAmountExact;

      if (i === totalInstallments) {
        principalThisPeriod = remainingBalanceForSchedule;
        total = principalThisPeriod + interestThisPeriod + expenseComponent;
      }

      remainingBalanceForSchedule -= principalThisPeriod;

      schedule.push({
        loanId,
        installmentNumber: i,
        dueDate: new Date(nextDueDate),
        principalAmount: parseFloat(principalThisPeriod.toFixed(6)),
        interestAmount: parseFloat(interestThisPeriod.toFixed(6)),
        totalInstallmentAmount: parseFloat(total.toFixed(6)),
        principalBalancePending: parseFloat(
          Math.max(0, remainingBalanceForSchedule).toFixed(6),
        ),
        paymentStatus: PaymentStatusEnum.PENDING,
        createdById,
      });

      if (termType === 'Plazos') {
        if (nextDueDate.getDate() === 16) {
          nextDueDate = getNextBiweeklyDueDate(nextDueDate, false);
        } else {
          nextDueDate = getNextBiweeklyDueDate(nextDueDate, true);
        }
      } else {
        nextDueDate = getLastDayOfMonth(
          new Date(nextDueDate.getFullYear(), nextDueDate.getMonth() + 1, 1),
        );
      }
    }

    return schedule;
  }

  private calculatePercentage(value: number, percentage: number): number {
    return (value * percentage) / 100;
  }

  private calculateEndDate(
    startDate: Date,
    numInstallments: number,
    termType: string,
  ): Date {
    const result = new Date(startDate);
    const daysPerInstallment = termType === 'Plazos' ? 15 : 30;
    const totalDays = numInstallments * daysPerInstallment;
    result.setDate(result.getDate() + totalDays);
    return result;
  }

  async request(tenantId: string, userId: string, dto: CreateLoanDto) {
    const {
      associateId,
      loanTypeId,
      requestedAmount,
      loanModality,
      paymentMethod,
      startDate,
      description,
      overdraftAmount,
      previousLoanId,
    } = dto;

    return this.db.transaction(async (tx) => {
      const existingLoan = await tx
        .select()
        .from(loans)
        .where(
          and(
            eq(loans.tenantId, tenantId),
            eq(loans.associateId, associateId),
            eq(loans.requestedAmount, requestedAmount.toString()),
            eq(loans.loanTypeId, loanTypeId),
            eq(loans.status, LoanStatusEnum.REQUESTED),
          ),
        );

      if (existingLoan.length > 0) {
        throw new BadRequestException(
          'A loan with the same characteristics already exists.',
        );
      }

      const [associate] = await tx
        .select({
          isPayrollCredit: associates.isPayrollCredit,
          balance: associateHaberesBalance.haberesBalance,
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
          eq(associateHaberesBalance.associateAccountId, associateAccounts.id),
        );

      if (associate?.isPayrollCredit) {
        throw new BadRequestException('has an active payroll credit.');
      }

      const [getLoanTypes] = await tx
        .select()
        .from(loanTypes)
        .where(
          and(eq(loanTypes.id, loanTypeId), eq(loanTypes.tenantId, tenantId)),
        );

      const setting = await tx.query.tenantSettings.findFirst({
        where: and(
          eq(tenantSettings.tenantId, tenantId),
          eq(tenantSettings.key, 'DEFAULT_CURRENCY'),
        ),
      });

      const [insertedLoan] = await tx
        .insert(loans)
        .values({
          tenantId: String(tenantId),
          associateId,
          loanTypeId,
          requestedAmount: String(requestedAmount),
          loanModality: loanModality,
          paymentMethod,
          status: LoanStatusEnum.REQUESTED,
          startDate: new Date(startDate),
          requestDate: new Date(),
          overdraftAmount: overdraftAmount ? String(overdraftAmount) : null,
          previousLoanId,
          currencyCode: setting?.value === '1' ? 'VES' : 'USD',
          createdById: userId,
          updatedById: userId,
          notes: description,
        })
        .returning({
          id: loans.id,
          customReference: loans.customReference,
        });

      await tx.insert(loanStatusHistory).values({
        loanId: insertedLoan.id,
        status: LoanStatusEnum.REQUESTED,
        changedAt: new Date(),
        changedByUserId: userId,
        comment: 'Loan requested',
      });

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'loans',
          recordId: insertedLoan.id,
          action: 'INSERT',
          userId: userId,
          area: 'PRESTAMOS',
          description: 'Solicitud de Prestamo',
          newData: {
            id: insertedLoan.id,
            associateId,
            loanTypeId,
            requestedAmount,
          },
        }),
      );

      return insertedLoan;
    });
  }

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
      .where(where)
      .orderBy(orderBy)
      .leftJoin(associates, eq(loans.associateId, associates.id))
      .leftJoin(loanTypes, eq(loans.loanTypeId, loanTypes.id))
      .limit(limit)
      .offset(offset);

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
      data: data.map((loan) => ({
        ...loan,
        requestedAmount: Number(loan.requestedAmount).toFixed(2),
      })),
      meta,
    };
  }

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

    return {
      id: data.id,
      associateId: data.associateId,
      associateCedula: data.associateCedula,
      associateFullname: data.associateFullname,
      associatePhone: data.associatePhone,
      associateEmail: data.associateEmail,
      associateDateAdmission: data.associateDateAdmission,
      associateIsPayrollCredit: data.associateIsPayrollCredit,
      associateAccountId: data.associateAccountId,
      associateAccountNumber: data.associateAccountNumber,
      associateBalance: data.associateBalance,
      loanTypeId: data.loanTypeId,
      loanModality: data.loanModality,
      loanTypeName: data.loanTypeName,
      requestDate: data.requestDate,
      approvalDate: data.approvalDate,
      disbursementDate: data.disbursementDate,
      requestedAmount: data.requestedAmount,
      approvedAmount: data.approvedAmount,
      disbursedAmount: data.disbursedAmount,
      startDate: data.startDate,
      endDate: data.endDate,
      totalInterest: data.totalInterest,
      totalPayable: data.totalPayable,
      expensesAmount: data.expensesAmount,
      overdraftAmount: data.overdraftAmount,
      previousLoanId: data.previousLoanId,
      paymentMethod: data.paymentMethod,
      disbursementAccountId: data.disbursementAccountId,
      status: data.status,
      rejectionReason: data.rejectionReason,
      approvedByUserId: data.approvedByUserId,
      disbursedByUserId: data.disbursedByUserId,
      notes: data.notes,
      customReference: data.customReference,
      currencyCode: data.currencyCode,
      exchangeRateId: data.exchangeRateId,
      totalLoans: total,
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
          ne(schema.credits.status, 'PAID'),
          ne(schema.credits.status, 'REQUESTED'),
        ),
      );

    const result = await this.db
      .select({ requestedApproved: loans.approvedAmount })
      .from(loans)
      .where(
        and(
          eq(loans.tenantId, tenantId),
          eq(loans.associateId, associate.id),
          ne(loans.status, LoanStatusEnum.PAID),
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
        requestedApproved:
          result.length !== 0 ? result[0].requestedApproved : null,
      },
      totalLoans: total,
      totalCredits: totalCredit,
    };
  }

  async approve(id: string, tenantId: string, userId: string) {
    return this.db.transaction(async (tx) => {
      const [loan] = await tx
        .select()
        .from(loans)
        .where(and(eq(loans.id, id), eq(loans.tenantId, tenantId)))
        .for('update');

      if (!loan || loan.status !== LoanStatusEnum.REQUESTED) {
        throw new BadRequestException(
          'Préstamo no encontrado o no está en estado solicitado',
        );
      }

      const {
        associateId,
        requestedAmount,
        loanTypeId,
        startDate,
        termType,
        termUnits,
        interestRate,
        expensesPercentage: savedExpensesPercentage,
      } = loan;

      const activeLoan = await tx
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

      if (activeLoan.length > 0) {
        throw new InternalServerErrorException(
          'The member already has an approved loan.',
        );
      }

      const [associate] = await tx
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
          eq(associateHaberesBalance.associateAccountId, associateAccounts.id),
        );

      if (associate?.isPayrollCredit) {
        throw new InternalServerErrorException('has an active payroll credit.');
      }

      const maxAllowedAmount = this.calculatePercentage(
        Number(associate?.balance ?? 0),
        80,
      );

      if (Number(requestedAmount) > maxAllowedAmount) {
        throw new InternalServerErrorException(
          'Your available funds are less than the requested amount.',
        );
      }

      const setting = await tx.query.tenantSettings.findFirst({
        where: and(
          eq(tenantSettings.tenantId, tenantId),
          eq(tenantSettings.key, 'DEFAULT_CURRENCY'),
        ),
      });
      const entryDate = new Date().toISOString().split('T')[0];
      const exchangeRateData = await tx.query.exchangeRates.findFirst({
        where: eq(exchangeRates.fetchedAt, new Date(entryDate)),
      });

      const [getLoanTypes] = await tx
        .select()
        .from(loanTypes)
        .where(
          and(eq(loanTypes.id, loanTypeId), eq(loanTypes.tenantId, tenantId)),
        );

      const annualInterestRate = interestRate
        ? parseFloat(interestRate)
        : parseFloat(getLoanTypes.interestRate);

      const numInstallments = termUnits ?? getLoanTypes.termUnits;

      const expensePercentage =
        savedExpensesPercentage != null
          ? parseFloat(savedExpensesPercentage)
          : parseFloat(getLoanTypes.administrativeExpensePercentage ?? '0');

      const capital = Number(requestedAmount);

      const periodsPerYear =
        (termType ?? getLoanTypes.termType) === 'Plazos' ? 24 : 12;
      const r = annualInterestRate / 100 / periodsPerYear;
      const n = numInstallments;
      const factor = Math.pow(1 + r, n);
      const frenchInstallment = (capital * r * factor) / (factor - 1);
      const totalInterestCalc = frenchInstallment * n - capital;

      const expensesAmountCalc = (capital * expensePercentage) / 100;
      const totalPayableCalc = frenchInstallment * n + expensesAmountCalc;
      const installmentPerPeriod = frenchInstallment + expensesAmountCalc / n;

      const totalDisbursedCalc = capital;

      let totalQuota = installmentPerPeriod;
      let totalInterest = totalInterestCalc;
      let installmentAmount = expensesAmountCalc;
      let totalPayable = totalPayableCalc;
      let totalDisbursed = totalDisbursedCalc;

      if (setting && setting.value === 'USD' && exchangeRateData) {
        const rate = Number(exchangeRateData.rate);
        totalQuota /= rate;
        totalInterest /= rate;
        installmentAmount /= rate;
        totalPayable /= rate;
        totalDisbursed /= rate;
      }

      const customReference =
        await this.generateCodeService.generateNextReference(
          'PRE',
          tenantId,
          'loans',
          'management',
        );
      const approvalDate = new Date();

      const finalDate = this.calculateEndDate(
        new Date(startDate!),
        numInstallments,
        termType ?? getLoanTypes.termType ?? 'Plazos',
      );

      const [loanUpdated] = await tx
        .update(loans)
        .set({
          status: LoanStatusEnum.APPROVED,
          approvalDate: approvalDate.toISOString(),
          customReference: customReference,
          approvedByUserId: userId,
          endDate: finalDate.toISOString(),
          totalInterest: String(totalInterest.toFixed(6)),
          installmentAmount: String(totalQuota.toFixed(6)),
          expensesAmount: String(installmentAmount.toFixed(6)),
          totalPayable: String(totalPayable.toFixed(6)),
          disbursedAmount: String(totalDisbursed.toFixed(6)),
          approvedAmount: String(requestedAmount),
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
        changedAt: new Date(),
        changedByUserId: userId,
        comment: 'LOAN APPROVED',
      });

      const schedule = this.generateAmortizationSchedule(
        capital,
        n,
        annualInterestRate,
        approvalDate,
        id,
        userId,
        (termType ? termType : 'Plazos') as 'Plazos' | 'Cuotas',
        expensesAmountCalc,
      );

      if (schedule.length > 0) {
        await tx.insert(loanAmortizationSchedule).values(
          schedule.map((item) => ({
            ...item,
            dueDate: item.dueDate.toISOString(),
            principalAmount: item.principalAmount.toString(),
            interestAmount: item.interestAmount.toString(),
            totalInstallmentAmount: item.totalInstallmentAmount.toString(),
            principalBalancePending: item.principalBalancePending.toString(),
            createdById: item.createdById,
          })),
        );
      }

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'loans',
          recordId: id,
          action: 'UPDATE',
          userId: userId,
          area: 'PRESTAMOS',
          description: 'APROBACION DE PRESTAMO',
          newData: { status: LoanStatusEnum.APPROVED, customReference },
        }),
      );

      return {
        id: loanUpdated.id,
        customReference: loanUpdated.customReference ?? null,
      };
    });
  }

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

    const setting = await this.db.query.tenantSettings.findFirst({
      where: and(
        eq(tenantSettings.tenantId, tenantId),
        eq(tenantSettings.key, 'DEFAULT_CURRENCY'),
      ),
    });
    const entryDate = new Date().toISOString().split('T')[0];
    const exchangeRateData = await this.db.query.exchangeRates.findFirst({
      where: eq(exchangeRates.fetchedAt, new Date(entryDate)),
    });

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

    const periodsPerYear = resolvedTermType === 'Plazos' ? 24 : 12;
    const r = annualInterestRate / 100 / periodsPerYear;
    const n = numInstallments;
    const factor = Math.pow(1 + r, n);
    const frenchInstallment = (capital * r * factor) / (factor - 1);

    let totalInterest = frenchInstallment * n - capital;
    let installmentAmount = (capital * expensePercentage) / 100;
    let totalPayable = frenchInstallment * n + installmentAmount;
    let totalQuota = frenchInstallment + installmentAmount / n;
    let totalDisbursed = capital;

    if (setting && setting.value === 'USD' && exchangeRateData) {
      const rate = Number(exchangeRateData.rate);
      totalQuota /= rate;
      totalInterest /= rate;
      installmentAmount /= rate;
      totalPayable /= rate;
      totalDisbursed /= rate;
    }

    let approvalDate: Date | null = null;
    const currentDate = new Date();

    const finalDate = this.calculateEndDate(
      dto?.startDate ? new Date(dto.startDate) : currentDate,
      numInstallments,
      resolvedTermType,
    );

    if (dto?.status === LoanStatusEnum.APPROVED) {
      approvalDate = currentDate;
    }

    const updatedLoan = await this.db.transaction(async (tx) => {
      const updateSet: Record<string, unknown> = {
        interestRate: dto.interestRate ? String(dto.interestRate) : null,
        loanModality: dto?.loanModality,
        requestDate: dto?.requestDate?.split('T')[0],
        approvalDate: approvalDate?.toISOString().split('T')[0],
        disbursementDate: null,
        requestedAmount:
          dto.requestedAmount !== null && dto.requestedAmount !== undefined
            ? String(dto.requestedAmount)
            : undefined,
        approvedAmount:
          dto.requestedAmount !== null && dto.requestedAmount !== undefined
            ? String(dto.requestedAmount)
            : undefined,
        disbursedAmount:
          dto.requestedAmount !== null && dto.requestedAmount !== undefined
            ? String(totalDisbursed)
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
        expensesAmount:
          installmentAmount !== null && installmentAmount !== undefined
            ? String(installmentAmount.toFixed(6))
            : undefined,
        overdraftAmount:
          dto.overdraftAmount !== null && dto.overdraftAmount !== undefined
            ? String(dto.overdraftAmount)
            : undefined,
        previousLoanId: dto.previousLoanId ?? null,
        paymentMethod: dto.paymentMethod,
        disbursementAccountId: dto.disbursementAccountId,
        status: dto?.status,
        approvedByUserId: userId,
        disbursedByUserId: null,
        notes: dto.notes ?? null,
        currencyCode: setting?.value === '1' ? 'VES' : 'USD',
        exchangeRateId: setting?.value === '2' ? exchangeRateData?.id : null,
        updatedBy: userId,
        updatedAt: new Date(),
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

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'loans',
          recordId: result.id,
          action: 'UPDATE',
          userId: userId,
          area: 'PRESTAMOS',
          description: 'ACTUALIZACION DE PRESTAMO',
          newData: updateSet,
        }),
      );

      if (dto?.status === LoanStatusEnum.APPROVED) {
        const schedule = this.generateAmortizationSchedule(
          dto.requestedAmount!,
          numInstallments,
          annualInterestRate,
          dto.startDate ? new Date(dto.startDate) : new Date(),
          id,
          userId,
        );
        if (schedule.length > 0) {
          await tx.insert(loanAmortizationSchedule).values(
            schedule.map((item) => ({
              ...item,
              dueDate: item.dueDate.toISOString(),
              principalAmount: item.principalAmount.toString(),
              interestAmount: item.interestAmount.toString(),
              totalInstallmentAmount: item.totalInstallmentAmount.toString(),
              principalBalancePending: item.principalBalancePending.toString(),
            })),
          );
        }

        await tx.insert(loanStatusHistory).values({
          loanId: id,
          status: dto.status,
          changedAt: new Date(),
          changedByUserId: userId,
          comment: 'Loan updated',
        });
      }

      return result;
    });

    return updatedLoan;
  }

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
        .set({ status: 'CANCELLED', updatedById: userId })
        .where(and(eq(loans.id, id), eq(loans.tenantId, tenantId)));

      await tx.insert(loanStatusHistory).values({
        loanId: id,
        status: 'CANCELLED',
        changedAt: new Date(),
        changedByUserId: userId,
        comment: 'Loan canceled',
      });

      await tx
        .update(loanAmortizationSchedule)
        .set({ paymentStatus: 'CANCELED' })
        .where(eq(loanAmortizationSchedule.loanId, id));

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'loans',
          recordId: id,
          action: 'CANCELED',
          userId: userId,
          area: 'PRESTAMOS',
          description: 'CANCELACION DE PRESTAMO',
          newData: { status: 'CANCELLED' },
        }),
      );

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

    return {
      totalLoansOrdinary: Number(totalLoansOrdinary[0].count),
      totalLoanSpecialQuotas: Number(totalLoanSpecialQuotas[0].count),
      totalLoanPaid: Number(totalLoanPaid[0].count),
      totalLoanInPaymet: Number(totalLoanInPaymet[0].count),
    };
  }

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
