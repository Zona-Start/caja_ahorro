import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import {
  loanAmortizationSchedule,
  loans,
  loanStatusHistory,
  systemSettings,
} from '@/database/index';
import { SettingsSystemService } from '@/features/core/settings-system/settings-system.service';
import { LoanStatusEnum, PaymentStatusEnum } from '@/types/enum';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
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

  async create(createLoanDto: CreateLoanDto, userId: number): Promise<Loan> {
    const {
      associateId,
      amount,
      termMonths,
      status,
      requestDate,
      purpose,
      createdById,
    } = createLoanDto;

    //Fetch interest rate from systemSettings
    const interestRateSetting = await this.db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'porcentaje_prestamos'), // Use the correct key
    });

    if (!interestRateSetting || !interestRateSetting.value) {
      throw new InternalServerErrorException(
        'Loan interest rate setting not found or invalid.',
      );
    }
    const annualInterestRate = parseFloat(interestRateSetting.value);
    const monthlyInterestRate = annualInterestRate / 100 / 12;

    // 1. Perform calculations
    // Using the standard formula for annuity loan payments
    const monthlyPayment =
      amount *
      (monthlyInterestRate /
        (1 - Math.pow(1 + monthlyInterestRate, -termMonths)));
    const totalAmountToPay = monthlyPayment * termMonths;
    const totalInterestAmount = totalAmountToPay - amount;

    let customReference: string | null = null;
    let approvalDate: Date | null = null;
    const currentDate = new Date();

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
          amount,
          termMonths,
          interestRate: annualInterestRate, // Store annual rate
          totalInterestAmount: parseFloat(totalInterestAmount.toFixed(2)),
          totalAmount: parseFloat(totalAmountToPay.toFixed(2)), // Total principal + interest
          monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
          status,
          requestDate: new Date(requestDate),
          approvalDate,
          customReference,
          purpose,
          createdById: userId,
          updatedById: createdById, // Set updatedById initially
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
          amount,
          monthlyInterestRate,
          termMonths,
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
