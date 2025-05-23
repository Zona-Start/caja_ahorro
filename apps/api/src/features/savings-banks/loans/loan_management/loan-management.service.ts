import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import {
  associateAccounts,
  associates,
  company,
  exchangeRates,
  loanAmortizationSchedule,
  loans,
  loanStatusHistory,
  loanTypes,
  systemSettings,
} from '@/database/index';
import { SettingsSystemService } from '@/features/core/settings-system/settings-system.service';
import {
  loanModalityTypeEnum,
  LoanStatusEnum,
  PaymentStatusEnum,
} from '@/types/enum';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { and, count, eq, ilike, ne, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateLoanDto } from './dto/create-loan.dto';
import { FilterLoanManagementDto } from './dto/filter-loan-management.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanAmortizationSchedule } from './entities/loan-amortization-schedule.entity';

@Injectable()
export class LoanManagementService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly settingsSystemService: SettingsSystemService,
  ) {}

  // --- Helper function to generate custom reference ---
  private async generateCustomReference(): Promise<string> {
    // Fetch the current correlative number and increment it
    const key = 'correlativo_prestamo';
    try {
      const result = await this.db.transaction(async (tx) => {
        // Lock the row for update
        const setting = await tx.query.systemSettings.findFirst({
          where: eq(systemSettings.key, key),
          // Add forUpdate() if your Drizzle version supports it for row locking
          // Example: columns: {}, with: { forUpdate: true }
        });

        if (!setting) {
          throw new InternalServerErrorException(
            `System setting '${key}' not found.`,
          );
        }

        const currentNumber = parseInt(setting.value, 10);
        if (isNaN(currentNumber)) {
          throw new InternalServerErrorException(
            `Invalid correlative number format for '${key}'.`,
          );
        }

        const nextNumber = currentNumber + 1;
        const nextValue = nextNumber.toString().padStart(5, '0'); // Pad with leading zeros

        // Update the setting with the new value
        await tx
          .update(systemSettings)
          .set({ value: nextValue, updatedAt: new Date() }) // Assuming you have an updatedById field to set too
          .where(eq(systemSettings.id, setting.id));

        return nextValue; // Return the generated reference
      });
      return `PREST-${result}`; // Prefix the reference
    } catch (error) {
      console.error('Error generating custom reference:', error);
      throw new InternalServerErrorException(
        'Failed to generate custom loan reference.',
      );
    }
  }

  // --- Helper function to generate amortization schedule ---
  private generateAmortizationSchedule(
    loanAmount: number, // Monto del préstamo solicitado
    termMonths: number, // Plazos en meses
    annualInterestRate: number, // Tasa de interés anual
    administrativeFeeRate: number, // Tasa de interés por gasto administrativo
    startDate: Date, // Fecha de inicio del préstamo
    loanId: number, // Identificador del préstamo
  ): Omit<
    LoanAmortizationSchedule,
    | 'id'
    | 'paymentDate'
    | 'paidAmount'
    | 'accountingEntryId'
    | 'createdAt'
    | 'updatedAt'
    | 'createdById'
    | 'updatedById'
  >[] {
    const totalInterest = (loanAmount * annualInterestRate) / 100;
    const totalAdministrativeFee = (loanAmount * administrativeFeeRate) / 100;
    const totalAmountPayable =
      loanAmount + totalInterest + totalAdministrativeFee;
    const monthlyPayment = totalAmountPayable / termMonths;
    const monthlyInterestRate = annualInterestRate / 12 / 100; // Convert annual to monthly

    const schedule: Omit<
      LoanAmortizationSchedule,
      | 'id'
      | 'paymentDate'
      | 'paidAmount'
      | 'accountingEntryId'
      | 'createdAt'
      | 'updatedAt'
      | 'createdById'
      | 'updatedById'
    >[] = [];
    let remainingBalance = loanAmount;
    let currentDueDate = new Date(startDate);

    for (let i = 1; i <= termMonths; i++) {
      const interestComponent = remainingBalance * monthlyInterestRate;
      const principalComponent = monthlyPayment - interestComponent;

      // Adjust last payment to avoid rounding errors
      if (i === termMonths) {
        // The last principal payment should be the remaining balance
        // The last total payment will be the remaining balance + interest for that period
        const lastInterestComponent = remainingBalance * monthlyInterestRate;
        const lastPrincipalComponent = remainingBalance;
        const lastTotalInstallmentAmount =
          lastPrincipalComponent + lastInterestComponent;
        schedule.push({
          loanId,
          installmentNumber: i,
          dueDate: new Date(currentDueDate), // Clone date object
          principalAmount: parseFloat(lastPrincipalComponent.toFixed(2)),
          interestAmount: parseFloat(lastInterestComponent.toFixed(2)),
          totalInstallmentAmount: parseFloat(
            lastTotalInstallmentAmount.toFixed(2),
          ),
          principalBalancePending: 0, // Should be zero on the last payment
          paymentStatus: PaymentStatusEnum.PENDING, // Default status
        });
        remainingBalance = 0; // Ensure remaining balance is exactly zero
      } else {
        remainingBalance -= principalComponent;

        // Ensure remaining balance doesn't go below zero due to floating point issues
        if (remainingBalance < 0.005) {
          remainingBalance = 0;
        }

        schedule.push({
          loanId,
          installmentNumber: i,
          dueDate: new Date(currentDueDate), // Clone date object
          principalAmount: parseFloat(principalComponent.toFixed(2)),
          interestAmount: parseFloat(interestComponent.toFixed(2)),
          totalInstallmentAmount: parseFloat(monthlyPayment.toFixed(2)),
          principalBalancePending: parseFloat(remainingBalance.toFixed(2)),
          paymentStatus: PaymentStatusEnum.PENDING, // Default status
        });
      }

      // Calculate next due date (e.g., add one month)
      currentDueDate.setMonth(currentDueDate.getMonth() + 1);
    }

    return schedule;
  }

  // Helper function to calculate percentage
  private calculatePercentage(value: number, percentage: number): number {
    return (value * percentage) / 100;
  }

  // Helper function to add months to a date
  private addMonthsToDate(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  async create(
    createLoanDto: CreateLoanDto,
    userId: number,
  ): Promise<{ id: number; customReference: string | null }> {
    const {
      associateId,
      requestedAmount,
      status,
      requestDate,
      startDate,
      disbursementAccountId,
      loanTypeId,
      paymentMethod,
      previousLoanId,
      notes,
      loanModality,
      overdraftAmount,
    } = createLoanDto;

    //consulta los datos de la empresa, moneda y tasa de cambio
    const [requestCompanyId] = await this.db
      .select({
        id: company.id,
      })
      .from(company);

    const setting = await this.db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'moneda'),
    });
    const entryDate = new Date().toISOString().split('T')[0];
    const exchangeRateData = await this.db.query.exchangeRates.findFirst({
      where: eq(exchangeRates.date, entryDate),
    });

    // Verificar si existe un préstamo duplicado con las mismas características
    const existingLoan = await this.db
      .select()
      .from(loans)
      .where(
        and(
          eq(loans.associateId, associateId),
          eq(loans.requestedAmount, requestedAmount.toString()),
          eq(loans.loanTypeId, loanTypeId),
          eq(loans.status, status),
        ),
      );

    if (existingLoan.length > 0) {
      throw new InternalServerErrorException(
        'A loan with the same characteristics already exists.',
      );
    }

    // Verificar si el asociado tiene un préstamo aprobado o desembolsado
    const activeLoan = await this.db
      .select()
      .from(loans)
      .where(
        or(
          and(
            eq(loans.associateId, associateId),
            eq(loans.status, LoanStatusEnum.APPROVED),
          ),
          and(
            eq(loans.associateId, associateId),
            eq(loans.status, LoanStatusEnum.DISBURSED),
          ),
        ),
      );

    if (activeLoan.length > 0) {
      throw new InternalServerErrorException(
        'The member already has an approved or disbursed loan in the payment process.',
      );
    }

    const [associate] = await this.db
      .select({
        isPayrollCredit: associates.isPayrollCredit,
        balance: associateAccounts.balance,
      })
      .from(associates)
      .where(eq(associates.id, associateId))
      .leftJoin(
        associateAccounts,
        eq(associateAccounts.associateId, associateId),
      );

    // verifica si el asociado tiene un credinomina activo
    if (associate.isPayrollCredit) {
      throw new InternalServerErrorException('has an active payroll credit.');
    }

    // const assetsPercentage = this.calculatePercentage(
    //   Number(associate?.balance ?? 0),
    //   80,
    // );

    // //valida  que le monto solicitado sea menor al 80 de sus haberes disponible
    // if (Number(assetsPercentage) < Number(requestedAmount)) {
    //   throw new InternalServerErrorException(
    //     'Your available funds are less than the requested amount.',
    //   );
    // }

    //Fetch type loan
    const [getLoanTypes] = await this.db
      .select()
      .from(loanTypes)
      .where(eq(loanTypes.id, loanTypeId));

    // 1. Perform calculations
    // Using the standard formula for annuity loan payments
    const annualInterestRate = parseFloat(getLoanTypes.interestRate); // Tasa de interés anual
    const term = getLoanTypes.termUnits; // Plazo en meses
    const expensePercentage = parseFloat(
      getLoanTypes.administrativeExpensePercentage ?? '0',
    ); //  Tasa Porcentaje de gastos administrativos
    const percentageInterest = (requestedAmount * annualInterestRate) / 100; // Porcentaje de cuota
    const percentageExpenses = (requestedAmount * expensePercentage) / 100; // Porcentaje de gastos

    let totalQuota = 0; //Cálculo del pago cuotas mesual
    let totalInterest = 0; //Cálculo del monto total de intereses
    let installmentAmount = 0; //total gasto administrativo
    let totalPayable = 0; //Cálculo del monto total a pagar
    if (setting && setting.value === 'USD' && exchangeRateData) {
      totalQuota =
        (requestedAmount + percentageInterest + percentageExpenses) /
        term /
        Number(exchangeRateData.rate);
      totalInterest =
        (requestedAmount * annualInterestRate) /
        100 /
        Number(exchangeRateData.rate);
      installmentAmount =
        (requestedAmount * expensePercentage) /
        100 /
        Number(exchangeRateData.rate);
      totalPayable =
        (requestedAmount + totalInterest + installmentAmount) /
        Number(exchangeRateData.rate);
    } else {
      totalQuota =
        (requestedAmount + percentageInterest + percentageExpenses) / term;
      totalInterest = (requestedAmount * annualInterestRate) / 100;
      installmentAmount = (requestedAmount * expensePercentage) / 100;
      totalPayable = requestedAmount + totalInterest + installmentAmount;
    }

    let customReference: string | null = null;
    let approvalDate: Date | null = null;
    const currentDate = new Date(); // Fecha actual
    const finalDate = this.addMonthsToDate(startDate, getLoanTypes.termUnits); //fecha finalizacion del pago

    // 2 & 3. Handle APPROVED status
    if (
      status !== LoanStatusEnum.REQUESTED &&
      status !== LoanStatusEnum.REJECTED
    ) {
      customReference = await this.generateCustomReference();
      approvalDate = currentDate;
    }

    // Start transaction
    const newLoan = await this.db.transaction(async (tx) => {
      // Insert into loans table
      const insertedLoans = await tx
        .insert(loans)
        .values({
          associateId: Number(associateId),
          companyId: Number(requestCompanyId.id),
          loanTypeId: Number(loanTypeId),
          loanModality: loanModality,
          requestDate: requestDate.toISOString().split('T')[0],
          approvalDate: approvalDate
            ? approvalDate.toISOString().split('T')[0]
            : null,
          disbursementDate: status === 'DISBURSED' ? new Date() : null,
          requestedAmount: requestedAmount,
          approvedAmount: requestedAmount,
          disbursedAmount: requestedAmount,
          startDate: startDate.toISOString().split('T')[0],
          endDate: finalDate,
          totalInterest: String(totalInterest.toFixed(2)),
          totalPayable: String(totalPayable.toFixed(2)),
          installmentAmount: String(totalQuota.toFixed(2)),
          expensesAmount: installmentAmount.toString(),
          overdraftAmount: overdraftAmount ?? null,
          previousLoanId: previousLoanId ?? null,
          paymentMethod: paymentMethod,
          disbursementAccountId: disbursementAccountId,
          status: status,
          approvedByUserId: userId,
          disbursedByUserId: status === 'DISBURSED' ? userId : null,
          notes: notes ?? null,
          customReference: customReference,
          currencyCode: setting?.value === '1' ? 'VES' : 'USD',
          currencyRate: setting?.value === '2' ? exchangeRateData?.id : null,
          createdById: userId,
          updatedById: userId, // Set updatedById initially
        })
        .returning({
          id: loans.id,
          customReference: loans.customReference,
        });

      if (
        !insertedLoans ||
        !Array.isArray(insertedLoans) ||
        insertedLoans.length === 0
      ) {
        throw new InternalServerErrorException('Failed to create loan.');
      }
      const newLoan = insertedLoans[0];

      // 4. Save initial status history
      await tx.insert(loanStatusHistory).values({
        loanId: newLoan.id,
        status,
        changedAt: currentDate,
        changedByUserId: userId,
        comment: 'Loan created',
      });

      // 5. Generate and save amortization schedule if APPROVED
      if (status === LoanStatusEnum.APPROVED) {
        const schedule = this.generateAmortizationSchedule(
          requestedAmount, // Monto del préstamo solicitado
          term, // Plazos en meses
          annualInterestRate, // Tasa de interés anual
          expensePercentage, // Tasa de interés por gasto administrativo
          approvalDate || currentDate, // Fecha de inicio del préstamo
          newLoan.id, // Identificador del préstamo
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
      }
      return newLoan;
    });

    // Convert to unknown first to safely cast to Loan type
    return newLoan;
  }

  async findAll(paginationDto: FilterLoanManagementDto) {
    const {
      page = 1,
      limit = 10,
      searchType = '',
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      status = '',
      type = 0,
      modality = '',
    } = paginationDto || {};

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build search condition
    let searchConditions: SQL<unknown>[] = [];

    if (search) {
      switch (searchType) {
        case 'cedula':
          searchConditions.push(ilike(associates.cedula, `%${search}%`));
          break;
        case 'fullname':
          searchConditions.push(ilike(associates.fullname, `%${search}%`));
          break;
      }
    }

    if (status) {
      searchConditions.push(eq(loans.status, status as LoanStatusEnum));
    }

    if (type !== 0) {
      searchConditions.push(eq(loans.loanTypeId, type));
    }

    if (modality) {
      searchConditions.push(
        eq(loans.loanModality, modality as loanModalityTypeEnum),
      );
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${loans[sortBy as keyof typeof loans]} asc`
        : sql`${loans[sortBy as keyof typeof loans]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .leftJoin(associates, eq(loans.associateId, associates.id))
      .leftJoin(loanTypes, eq(loans.loanTypeId, loanTypes.id))
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
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
      })
      .from(loans)
      .where(searchCondition)
      .orderBy(orderBy)
      .leftJoin(associates, eq(loans.associateId, associates.id))
      .leftJoin(loanTypes, eq(loans.loanTypeId, loanTypes.id))
      .limit(limit)
      .offset(offset);

    // Build pagination metadata
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
      data: data.map((loan): any => ({
        ...loan,
      })),
      meta,
    };
  }

  async findRequestByEdit(id: number) {
    // Get paginated data
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
        associateBalance: associateAccounts.balance,
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
      .where(eq(loans.id, id))
      .leftJoin(associates, eq(loans.associateId, associates.id))
      .leftJoin(
        associateAccounts,
        eq(loans.associateId, associateAccounts.associateId),
      )
      .leftJoin(loanTypes, eq(loans.loanTypeId, loanTypes.id));

    const [{ count: total }] = await this.db
      .select({
        count: count(),
      })
      .from(loans)
      .where(
        and(
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

  async findOneRequest(cedula: string) {
    try {
      const associate = await this.db
        .select({
          id: associates.id,
          cedula: associates.cedula,
          fullname: associates.fullname,
          phone: associates.phone,
          email: associates.email,
          dateAdmission: associates.dateAdmission,
          isPayrollCredit: associates.isPayrollCredit,
        })
        .from(associates)
        .where(
          and(eq(associates.cedula, cedula), eq(associates.status, 'ACTIVE')),
        );

      const associateAccount = await this.db
        .select({
          associateAccountId: associateAccounts.id,
          accountNumber: associateAccounts.accountNumber,
          balance: associateAccounts.balance,
        })
        .from(associateAccounts)
        .where(eq(associateAccounts.associateId, associate[0].id));

      const [{ count: total }] = await this.db
        .select({
          count: count(),
        })
        .from(loans)
        .where(
          and(
            eq(loans.associateId, associate[0].id),
            ne(loans.status, LoanStatusEnum.PAID),
            ne(loans.status, LoanStatusEnum.REQUESTED),
          ),
        );

      const result = await this.db
        .select({
          requestedAprrobed: loans.approvedAmount,
        })
        .from(loans)
        .where(
          and(
            eq(loans.associateId, associate[0].id),
            ne(loans.status, LoanStatusEnum.PAID),
          ),
        );

      return {
        associate: {
          ...associate[0],
          associateAccountId: associateAccount[0].associateAccountId,
          accountNumber: associateAccount[0].accountNumber,
          balance: associateAccount[0].balance,
          requestedAprrobed:
            result.length !== 0 ? result[0].requestedAprrobed : null,
        },
        totalLoans: total,
      };
    } catch (error) {
      console.log(error);

      return new InternalServerErrorException(
        'Error fetching loan request details.',
      );
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} loan`;
  }

  async update(
    id: number,
    updateLoanDto: UpdateLoanDto,
    userId: number,
  ): Promise<{ id: number; customReference: string | null }> {
    // 1. Obtener el préstamo actual

    const existingLoan = await this.db
      .select()
      .from(loans)
      .where(eq(loans.id, id));
    if (existingLoan.length === 0) {
      throw new InternalServerErrorException('Loan not found.');
    }

    const setting = await this.db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'moneda'),
    });
    const entryDate = new Date().toISOString().split('T')[0];
    const exchangeRateData = await this.db.query.exchangeRates.findFirst({
      where: eq(exchangeRates.date, entryDate),
    });

    // 2. Obtener datos relevantes para el cálculo
    const [getLoanTypes] = await this.db
      .select()
      .from(loanTypes)
      .where(
        eq(
          loanTypes.id,
          updateLoanDto.loanTypeId ?? existingLoan[0].loanTypeId,
        ),
      );

    // 3. Calcular nuevos valores si corresponde
    // 1. Perform calculations
    // Using the standard formula for annuity loan payments
    const annualInterestRate = parseFloat(getLoanTypes.interestRate); // Tasa de interés anual
    const term = getLoanTypes.termUnits; // Plazo en meses
    const expensePercentage = parseFloat(
      getLoanTypes.administrativeExpensePercentage ?? '0',
    ); //  Tasa Porcentaje de gastos administrativos
    const percentageInterest =
      ((updateLoanDto.requestedAmount ?? 0) * annualInterestRate) / 100; // Porcentaje de cuota
    const percentageExpenses =
      ((updateLoanDto.requestedAmount ?? 0) * expensePercentage) / 100; // Porcentaje de gastos

    let totalQuota = 0; //Cálculo del pago cuotas mesual
    let totalInterest = 0; //Cálculo del monto total de intereses
    let installmentAmount = 0; //total gasto administrativo
    let totalPayable = 0; //Cálculo del monto total a pagar
    if (setting && setting.value === 'USD' && exchangeRateData) {
      totalQuota =
        ((updateLoanDto?.requestedAmount ?? 0) +
          percentageInterest +
          percentageExpenses) /
        term /
        Number(exchangeRateData.rate);
      totalInterest =
        ((updateLoanDto?.requestedAmount ?? 0) * annualInterestRate) /
        100 /
        Number(exchangeRateData.rate);
      installmentAmount =
        ((updateLoanDto?.requestedAmount ?? 0) * expensePercentage) /
        100 /
        Number(exchangeRateData.rate);
      totalPayable =
        ((updateLoanDto?.requestedAmount ?? 0) +
          totalInterest +
          installmentAmount) /
        Number(exchangeRateData.rate);
    } else {
      totalQuota =
        ((updateLoanDto?.requestedAmount ?? 0) +
          percentageInterest +
          percentageExpenses) /
        term;
      totalInterest =
        ((updateLoanDto?.requestedAmount ?? 0) * annualInterestRate) / 100;
      installmentAmount =
        ((updateLoanDto?.requestedAmount ?? 0) * expensePercentage) / 100;
      totalPayable =
        (updateLoanDto?.requestedAmount ?? 0) +
        totalInterest +
        installmentAmount;
    }

    let customReference: string | null | undefined = undefined;
    let approvalDate: Date | null = null;
    const currentDate = new Date(); // Fecha actual
    const finalDate = this.addMonthsToDate(
      updateLoanDto?.startDate ?? currentDate,
      getLoanTypes.termUnits,
    ); //fecha finalizacion del pago

    // 2 & 3. Handle APPROVED status
    if (
      updateLoanDto?.status !== LoanStatusEnum.REQUESTED &&
      updateLoanDto?.status !== LoanStatusEnum.REJECTED
    ) {
      customReference = await this.generateCustomReference();
      approvalDate = currentDate;
    }

    const dataprueba = {
      ...updateLoanDto,
      associateId: Number(updateLoanDto.associateId),
      loanTypeId: Number(updateLoanDto.loanTypeId),
      loanModality: updateLoanDto?.loanModality,
      requestDate: updateLoanDto?.requestDate?.toISOString().split('T')[0],
      approvalDate: approvalDate?.toISOString().split('T')[0],
      disbursementDate:
        updateLoanDto?.status === 'DISBURSED'
          ? currentDate.toISOString().split('T')[0]
          : null,
      requestedAmount: updateLoanDto.requestedAmount!.toString(),
      approvedAmount: updateLoanDto.requestedAmount!.toString(),
      disbursedAmount: updateLoanDto.requestedAmount!.toString(),
      startDate: updateLoanDto?.startDate?.toISOString().split('T')[0],
      endDate: finalDate.toISOString().split('T')[0],
      totalInterest: String(totalInterest.toFixed(2)),
      totalPayable: String(totalPayable.toFixed(2)),
      installmentAmount: String(totalQuota.toFixed(2)),
      expensesAmount: String(installmentAmount.toFixed(2)),
      overdraftAmount: updateLoanDto.overdraftAmount ?? null,
      previousLoanId: updateLoanDto.previousLoanId ?? null,
      paymentMethod: updateLoanDto.paymentMethod,
      disbursementAccountId: updateLoanDto.disbursementAccountId,
      status: updateLoanDto?.status,
      approvedByUserId: userId,
      disbursedByUserId: updateLoanDto?.status === 'DISBURSED' ? userId : null,
      notes: updateLoanDto.notes ?? null,
      currencyCode: setting?.value === '1' ? 'VES' : 'USD',
      exchangeRateId: setting?.value === '2' ? exchangeRateData?.id : null,
      customReference: customReference,
      updatedById: userId, // Set updatedById initially
      updatedAt: new Date(),
    };
    console.log(dataprueba);

    // 4. Actualizar el préstamo y la tabla de amortización en una transacción
    const updatedLoan = await this.db.transaction(async (tx) => {
      // Actualizar préstamo

      const [loanUpdated] = await tx
        .update(loans)
        .set({
          ...updateLoanDto,
          associateId: Number(updateLoanDto.associateId),
          loanTypeId: Number(updateLoanDto.loanTypeId),
          loanModality: updateLoanDto?.loanModality,
          requestDate: updateLoanDto?.requestDate?.toISOString().split('T')[0],
          approvalDate: approvalDate?.toISOString().split('T')[0],
          disbursementDate:
            updateLoanDto?.status === 'DISBURSED'
              ? currentDate.toISOString().split('T')[0]
              : null,
          requestedAmount:
            updateLoanDto.requestedAmount !== null &&
            updateLoanDto.requestedAmount !== undefined
              ? String(updateLoanDto.requestedAmount)
              : undefined, // Usa undefined en vez de null
          approvedAmount:
            updateLoanDto.requestedAmount !== null &&
            updateLoanDto.requestedAmount !== undefined
              ? String(updateLoanDto.requestedAmount)
              : undefined, // Usa undefined en vez de null
          disbursedAmount:
            updateLoanDto.requestedAmount !== null &&
            updateLoanDto.requestedAmount !== undefined
              ? String(updateLoanDto.requestedAmount)
              : undefined, // Usa undefined en vez de null
          startDate: updateLoanDto?.startDate?.toISOString().split('T')[0],
          endDate: finalDate.toISOString().split('T')[0],
          totalInterest:
            totalInterest !== null && totalInterest !== undefined
              ? String(totalInterest.toFixed(2))
              : undefined, // Usa undefined en vez de null
          totalPayable:
            totalPayable !== null && totalPayable !== undefined
              ? String(totalPayable.toFixed(2))
              : undefined, // Usa undefined en vez de null
          installmentAmount:
            totalQuota !== null && totalQuota !== undefined
              ? String(totalQuota.toFixed(2))
              : undefined, // Usa undefined en vez de null
          expensesAmount:
            installmentAmount !== null && installmentAmount !== undefined
              ? String(installmentAmount.toFixed(2))
              : undefined, // Usa undefined en vez de null
          // *** LÍNEA CORREGIDA PARA overdraftAmount ***
          overdraftAmount:
            updateLoanDto.overdraftAmount !== null &&
            updateLoanDto.overdraftAmount !== undefined
              ? String(updateLoanDto.overdraftAmount)
              : undefined, // Usa undefined en vez de null
          previousLoanId: updateLoanDto.previousLoanId ?? null,
          paymentMethod: updateLoanDto.paymentMethod,
          disbursementAccountId: updateLoanDto.disbursementAccountId,
          status: updateLoanDto?.status,
          approvedByUserId: userId,
          disbursedByUserId:
            updateLoanDto?.status === 'DISBURSED' ? userId : null,
          notes: updateLoanDto.notes ?? null,
          currencyCode: setting?.value === '1' ? 'VES' : 'USD',
          exchangeRateId: setting?.value === '2' ? exchangeRateData?.id : null,
          customReference: customReference,
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(loans.id, id))
        .returning({
          id: loans.id,
          customReference: loans.customReference,
        });

      // const [loanUpdated] = await tx
      //   .update(loans)
      //   .set({
      //     ...updateLoanDto,
      //     associateId: Number(updateLoanDto.associateId),
      //     loanTypeId: Number(updateLoanDto.loanTypeId),
      //     loanModality: updateLoanDto?.loanModality,
      //     requestDate: updateLoanDto?.requestDate?.toISOString().split('T')[0],
      //     approvalDate: approvalDate?.toISOString().split('T')[0],
      //     disbursementDate:
      //       updateLoanDto?.status === 'DISBURSED'
      //         ? currentDate.toISOString().split('T')[0]
      //         : null,
      //     requestedAmount: updateLoanDto.requestedAmount!.toString(),
      //     approvedAmount: updateLoanDto.requestedAmount!.toString(),
      //     disbursedAmount: updateLoanDto.requestedAmount!.toString(),
      //     startDate: updateLoanDto?.startDate?.toISOString().split('T')[0],
      //     endDate: finalDate.toISOString().split('T')[0],
      //     totalInterest: String(totalInterest.toFixed(2)),
      //     totalPayable: String(totalPayable.toFixed(2)),
      //     installmentAmount: String(totalQuota.toFixed(2)),
      //     expensesAmount: String(installmentAmount.toFixed(2)),
      //     overdraftAmount: String(updateLoanDto.overdraftAmount) ?? null,
      //     previousLoanId: updateLoanDto.previousLoanId ?? null,
      //     paymentMethod: updateLoanDto.paymentMethod,
      //     disbursementAccountId: updateLoanDto.disbursementAccountId,
      //     status: updateLoanDto?.status,
      //     approvedByUserId: userId,
      //     disbursedByUserId:
      //       updateLoanDto?.status === 'DISBURSED' ? userId : null,
      //     notes: updateLoanDto.notes ?? null,
      //     currencyCode: setting?.value === '1' ? 'VES' : 'USD',
      //     exchangeRateId: setting?.value === '2' ? exchangeRateData?.id : null,
      //     customReference: customReference,
      //     updatedById: userId, // Set updatedById initially
      //     updatedAt: new Date(),
      //   })
      //   .where(eq(loans.id, id))
      //   .returning({
      //     id: loans.id,
      //     customReference: loans.customReference,
      //   });
      if (!loanUpdated) {
        throw new InternalServerErrorException('Failed to update loan.');
      }

      // Eliminar tabla de amortización anterior
      await tx
        .delete(loanAmortizationSchedule)
        .where(eq(loanAmortizationSchedule.loanId, id));

      // Generar y guardar nueva tabla de amortización
      const schedule = this.generateAmortizationSchedule(
        updateLoanDto.requestedAmount!,
        term,
        annualInterestRate,
        expensePercentage,
        updateLoanDto.startDate!,
        id,
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

      // Registrar historial de estatus
      await tx.insert(loanStatusHistory).values({
        loanId: id,
        status: updateLoanDto.status!,
        changedAt: new Date(),
        changedByUserId: userId,
        comment: 'Loan updated',
      });

      return loanUpdated;
    });

    return updatedLoan;
  }

  async remove(id: number): Promise<{ message: string }> {
    const [existingLoan] = await this.db
      .select()
      .from(loans)
      .where(eq(loans.id, id));

    if (!existingLoan) {
      throw new HttpException('Loan not found', HttpStatus.NOT_FOUND);
    }

    // 1. Verificar que el préstamo existe
    // const existingLoan = await this.db.query.loans.findFirst({
    //   where: eq(loans.id, id),
    // });
    // if (!existingLoan) {
    //   throw new InternalServerErrorException('Loan not found.');
    // }

    // // 2. Ejecutar la eliminación en una transacción
    // await this.db.transaction(async (tx) => {
    //   // Eliminar la tabla de amortización asociada

    //   // await tx
    //   //   .delete(loanAmortizationSchedule)
    //   //   .where(eq(loanAmortizationSchedule.loanId, id));
    //   // // Eliminar historial de estatus
    //   // await tx
    //   //   .delete(loanStatusHistory)
    //   //   .where(eq(loanStatusHistory.loanId, id));
    //   // Eliminar el préstamo
    // });
    await this.db.delete(loans).where(eq(loans.id, id));
    return { message: 'Loan deleted successfully' };
  }
}
