import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import {
  associateAccounts,
  associates,
  loanAmortizationSchedule,
  loans,
  loanStatusHistory,
  loanTypes,
  systemSettings,
} from '@/database/index';
import { SettingsSystemService } from '@/features/core/settings-system/settings-system.service';
import { LoanStatusEnum, PaymentStatusEnum } from '@/types/enum';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { and, eq, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanAmortizationSchedule } from './entities/loan-amortization-schedule.entity';
import { Loan } from './entities/loan.entity';

@Injectable()
export class LoanService {
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
    loanId: number,
    principal: number,
    monthlyInterestRate: number,
    termMonths: number,
    monthlyPayment: number,
    startDate: Date,
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
    let remainingBalance = principal;
    let currentDueDate = new Date(startDate);

    for (let i = 1; i <= termMonths; i++) {
      const interestComponent = remainingBalance * monthlyInterestRate;
      let principalComponent = monthlyPayment - interestComponent;

      // Adjust last payment to avoid rounding errors
      if (i === termMonths) {
        principalComponent = remainingBalance;
        monthlyPayment = remainingBalance + interestComponent; // Adjust final payment amount
      }

      remainingBalance -= principalComponent;

      // Ensure remaining balance doesn't go below zero due to floating point issues
      if (remainingBalance < 0.005) {
        remainingBalance = 0;
      }

      // Calculate next due date (e.g., add one month)
      currentDueDate.setMonth(currentDueDate.getMonth() + 1);

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

      // Reset monthly payment for next iteration if it was adjusted for the last payment
      if (i === termMonths) {
        // No need to reset if loop ends
      } else {
        // Re-calculate for safety, though it should be constant except last payment
        monthlyPayment =
          principal *
          (monthlyInterestRate /
            (1 - Math.pow(1 + monthlyInterestRate, -termMonths)));
      }
    }

    return schedule;
  }

  // Helper function to calculate percentage
  private calculatePercentage(value: number, percentage: number): number {
    return value * (percentage / 100);
  }

  // Helper function to add months to a date
  private addMonthsToDate(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  async create(createLoanDto: CreateLoanDto, userId: number): Promise<Loan> {
    const {
      associateId,
      requestedAmount,
      status,
      companyId,
      requestDate,
      disbursementAccountId,
      expensesAmount,
      loanTypeId,
      paymentMethod,
      previousLoanId,
      notes,
      overdraftAmount,
    } = createLoanDto;

    // Verificar si existe un préstamo duplicado con las mismas características
    const existingLoan = await this.db
      .select()
      .from(loans)
      .where(
        and(
          eq(loans.associateId, associateId),
          eq(loans.requestedAmount, requestedAmount),
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

    const assetsPercentage = this.calculatePercentage(
      Number(associate?.balance ?? 0),
      80,
    );

    //valida  que le monto solicitado sea menor al 80 de sus haberes disponible
    if (Number(assetsPercentage) < Number(requestedAmount)) {
      throw new InternalServerErrorException(
        'Your available funds are less than the requested amount.',
      );
    }

    //Fetch type loan
    const [getLoanTypes] = await this.db
      .select()
      .from(loanTypes)
      .where(eq(loanTypes.id, loanTypeId));

    const annualInterestRate = parseFloat(getLoanTypes.interestRate);
    const monthlyInterestRate = annualInterestRate / 100 / 12;

    // 1. Perform calculations
    // Using the standard formula for annuity loan payments
    const monthlyPayment =
      requestedAmount *
      (monthlyInterestRate /
        (1 - Math.pow(1 + monthlyInterestRate, -getLoanTypes.termUnits))); //Cálculo del pago mensual
    const totalAmountToPay = monthlyPayment * getLoanTypes.termUnits; //Cálculo del monto total a pagar
    const totalInterestAmount = totalAmountToPay - requestedAmount; //Cálculo del monto total de intereses

    const totalDisbursedAmount = requestedAmount - expensesAmount;

    let customReference: string | null = null;
    let approvalDate: Date | null = null;
    const currentDate = new Date(); // Fecha actual
    const nextMonthDate = this.addMonthsToDate(currentDate, 1); // fecha de comienzo pago

    const finalDate = this.addMonthsToDate(
      nextMonthDate,
      getLoanTypes.termUnits,
    ); //fecha finalizacion del pago

    // 2 & 3. Handle APPROVED status
    if (status === LoanStatusEnum.APPROVED) {
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
          companyId: Number(companyId),
          loanTypeId: Number(loanTypeId),
          requestDate: requestDate.toISOString().split('T')[0],
          approvalDate: approvalDate,
          disbursementDate: status === 'DISBURSED' ? new Date() : null,
          requestedAmount: requestedAmount,
          approvedAmount: requestedAmount,
          disbursedAmount: totalDisbursedAmount,
          startDate: nextMonthDate,
          endDate: finalDate,
          totalInterestAmount: parseFloat(totalInterestAmount.toFixed(2)),
          totalPayable: parseFloat(totalAmountToPay.toFixed(2)),
          expensesAmount: expensesAmount,
          overdraftAmount: overdraftAmount ?? null,
          previousLoanId: previousLoanId ?? null,
          paymentMethod: paymentMethod,
          disbursementAccountId: disbursementAccountId,
          status: status,
          approvedByUserId: userId,
          disbursedByUserId: status === 'DISBURSED' ? userId : null,
          notes: notes ?? null,
          customReference: customReference,
          createdById: userId,
          updatedById: userId, // Set updatedById initially
        })
        .returning();

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
          newLoan.id,
          requestedAmount,
          monthlyInterestRate,
          getLoanTypes.termUnits,
          monthlyPayment,
          approvalDate || currentDate, // Use approval date or current if somehow null
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
    return newLoan as unknown as Loan;
  }

  async findAll() {
    return this.db.select().from(loans);
  }

  findOne(id: number) {
    return `This action returns a #${id} loan`;
  }

  update(id: number, updateLoanDto: UpdateLoanDto) {
    return `This action updates a #${id} loan`;
  }

  remove(id: number) {
    return `This action removes a #${id} loan`;
  }
}
