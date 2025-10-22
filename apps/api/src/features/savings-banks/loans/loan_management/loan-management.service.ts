import { PaginationDto } from '@/common/dto/pagination.dto';
import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
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
import { associateHaberesBalance } from '@/database/schema/views';
import { AuditLogsService } from '@/features/audit/audit-logs/audit-logs.service';
import {
  ActionEnumAudit,
  CreditStatusEnum,
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
import { and, count, desc, eq, ilike, ne, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateLoanDto } from './dto/create-loan.dto';
import { FilterLoanManagementDto } from './dto/filter-loan-management.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanAmortizationSchedule } from './entities/loan-amortization-schedule.entity';

@Injectable()
export class LoanManagementService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // --- Helper function to generate amortization schedule ---
  // private generateAmortizationSchedule(
  //   loanAmount: number, // Monto del préstamo solicitado (capital)
  //   termMonths: number, // Plazos en meses
  //   annualInterestRate: number, // Tasa de interés anual (para calcular interés total fijo)
  //   startDate: Date, // Fecha de inicio del préstamo (para determinar la primera cuota)
  //   loanId: number, // Identificador del préstamo
  //   createdById: number,
  // ): Omit<
  //   LoanAmortizationSchedule,
  //   | 'id'
  //   | 'paymentDate'
  //   | 'paidAmount'
  //   | 'accountingEntryId'
  //   | 'createdAt'
  //   | 'updatedAt'
  //   | 'updatedById'
  // >[] {
  //   // 1. Cálculo del interés total FIJO para todo el plazo
  //   const totalInterestFixed = (loanAmount * annualInterestRate) / 100; // Ej: 450 * 0.06 = 27

  //   // 2. Monto Total a Pagar por el Cliente (Capital + Interés Fijo)
  //   const totalAmountToPayByClient = loanAmount + totalInterestFixed; // Ej: 450 + 27 = 477

  //   // 3. Cálculo del número TOTAL de cuotas quincenales (asumiendo que termMonths ya es el total de cuotas)
  //   // Si termMonths es 24 (cuotas), entonces totalInstallments = 24
  //   const totalInstallments = termMonths;

  //   // 4. Cálculo de la Cuota Quincenal Fija (sin redondear inicialmente)
  //   const biweeklyPaymentExact = totalAmountToPayByClient / totalInstallments; // Ej: 477 / 24 = 19.875

  //   // 5. Componente de Interés FIJO por Cuota Quincenal (sin redondear inicialmente)
  //   const biweeklyInterestComponentExact =
  //     totalInterestFixed / totalInstallments; // Ej: 27 / 24 = 1.125

  //   // 6. Componente de Capital FIJO por Cuota Quincenal (sin redondear inicialmente)
  //   const biweeklyPrincipalComponentExact = loanAmount / totalInstallments; // Ej: 450 / 24 = 18.75

  //   const schedule: Omit<
  //     LoanAmortizationSchedule,
  //     | 'id'
  //     | 'paymentDate'
  //     | 'paidAmount'
  //     | 'accountingEntryId'
  //     | 'createdAt'
  //     | 'updatedAt'
  //     | 'updatedById'
  //   >[] = [];

  //   let remainingPrincipalBalance = loanAmount; // Saldo de capital restante (con alta precisión)
  //   let totalInterestAccrued = 0; // Interés total acumulado para verificación
  //   let totalPrincipalPaid = 0; // Capital total pagado para verificación
  //   let totalPaymentsMade = 0; // Pagos totales realizados para verificación

  //   let currentCalculationDate = new Date(startDate); // Fecha de cálculo actual

  //   // Función auxiliar para obtener el último día de un mes
  //   const getLastDayOfMonth = (year: number, month: number): number => {
  //     return new Date(year, month + 1, 0).getDate();
  //   };

  //   // Función auxiliar para determinar la fecha de vencimiento quincenal
  //   const getNextBiweeklyDueDate = (
  //     currentDate: Date,
  //     isFirstHalf: boolean, // true para el 16, false para el 30/28
  //   ): Date => {
  //     const year = currentDate.getFullYear();
  //     const month = currentDate.getMonth(); // 0-11

  //     let day: number;
  //     let targetMonth = month;
  //     let targetYear = year;

  //     if (isFirstHalf) {
  //       if (currentDate.getDate() > 16) {
  //         targetMonth = month + 1;
  //         if (targetMonth > 11) {
  //           targetMonth = 0;
  //           targetYear++;
  //         }
  //       }
  //       day = 16;
  //     } else {
  //       if (currentDate.getDate() > getLastDayOfMonth(year, month) - 1) {
  //         // Lógica revisada para determinar si ya pasó el día de fin de mes
  //         targetMonth = month + 1;
  //         if (targetMonth > 11) {
  //           targetMonth = 0;
  //           targetYear++;
  //         }
  //       }
  //       day = getLastDayOfMonth(targetYear, targetMonth);
  //     }

  //     const nextDate = new Date(targetYear, targetMonth, day);
  //     nextDate.setHours(0, 0, 0, 0); // Asegurar hora al inicio del día
  //     return nextDate;
  //   };

  //   // Determinar la primera fecha de pago
  //   let nextDueDate: Date;
  //   if (startDate.getDate() <= 15) {
  //     nextDueDate = getNextBiweeklyDueDate(startDate, false); // Es la segunda mitad del mes actual (fin de mes)
  //   } else {
  //     nextDueDate = getNextBiweeklyDueDate(startDate, true); // Es la primera mitad del siguiente mes (día 16)
  //   }

  //   for (
  //     let installmentCounter = 1;
  //     installmentCounter <= totalInstallments;
  //     installmentCounter++
  //   ) {
  //     let principalComponentForInstallment = biweeklyPrincipalComponentExact;
  //     let interestComponentForInstallment = biweeklyInterestComponentExact;
  //     let totalInstallmentAmountForInstallment = biweeklyPaymentExact;

  //     // --- Ajuste para la ÚLTIMA cuota ---
  //     if (installmentCounter === totalInstallments) {
  //       // Ajustar el capital de la última cuota para que el saldo sea exactamente 0
  //       principalComponentForInstallment = remainingPrincipalBalance;

  //       // La cuota total es la suma de este capital ajustado y el interés.
  //       // Aquí puedes decidir si el interés de la última cuota también se ajusta si hay una desviación muy pequeña,
  //       // o si solo el capital absorbe la diferencia.
  //       // Para un interés fijo por cuota, es más común que el capital sea el que "cuadre" el saldo.
  //       totalInstallmentAmountForInstallment =
  //         principalComponentForInstallment + interestComponentForInstallment;

  //       // Opcional: Asegurarse de que el monto total sea exactamente totalAmountToPayByClient
  //       // Este paso es más para verificación si se hicieron ajustes complejos.
  //       // En tu caso de interés fijo, `totalInterestFixed` ya es exacto.
  //       // Si `biweeklyPaymentExact` y `biweeklyInterestComponentExact` ya se calcularon con alta precisión,
  //       // la suma final debería ser correcta.
  //     }

  //     // Se resta el componente de capital del saldo pendiente
  //     remainingPrincipalBalance -= principalComponentForInstallment;

  //     // Acumular totales (sin redondear aquí)
  //     totalPrincipalPaid += principalComponentForInstallment;
  //     totalInterestAccrued += interestComponentForInstallment;
  //     totalPaymentsMade += totalInstallmentAmountForInstallment;

  //     schedule.push({
  //       loanId,
  //       installmentNumber: installmentCounter,
  //       dueDate: new Date(nextDueDate), // Clonar la fecha
  //       // --- Redondeo FINAL al exportar para la base de datos o visualización ---
  //       principalAmount: parseFloat(
  //         principalComponentForInstallment.toFixed(6),
  //       ),
  //       interestAmount: parseFloat(interestComponentForInstallment.toFixed(6)),
  //       totalInstallmentAmount: parseFloat(
  //         totalInstallmentAmountForInstallment.toFixed(6),
  //       ),
  //       // El saldo pendiente del principal debe ser 0 para la última cuota,
  //       // pero debe reflejar el saldo exacto para las intermedias, redondeado solo al guardar/mostrar.
  //       principalBalancePending: parseFloat(
  //         remainingPrincipalBalance.toFixed(6),
  //       ),
  //       paymentStatus: PaymentStatusEnum.PENDING,
  //       createdById: createdById,
  //     });

  //     // Calcular la PRÓXIMA fecha de vencimiento
  //     if (nextDueDate.getDate() === 16) {
  //       nextDueDate = getNextBiweeklyDueDate(nextDueDate, false);
  //     } else {
  //       nextDueDate = getNextBiweeklyDueDate(nextDueDate, true);
  //     }
  //   }

  //   // --- Verificaciones finales para asegurar la precisión total ---
  //   // Estos `toFixed(2)` son solo para la verificación, no para los cálculos internos
  //   // const finalTotalInterestAccrued = parseFloat(totalInterestAccrued.toFixed(6));
  //   // const finalTotalPrincipalPaid = parseFloat(totalPrincipalPaid.toFixed(6));
  //   // const finalTotalPaymentsMade = parseFloat(totalPaymentsMade.toFixed(6));

  //   // Opcional: Comprobaciones de depuración
  //   // console.log('Total Capital Calculado:', finalTotalPrincipalPaid);
  //   // console.log('Total Intereses Calculados:', finalTotalInterestAccrued);
  //   // console.log('Suma Total Cuotas Calculadas:', finalTotalPaymentsMade);
  //   // console.log('Capital original:', loanAmount);
  //   // console.log('Interés Total original:', totalInterestFixed);
  //   // console.log('Monto Total a Pagar original:', totalAmountToPayByClient);

  //   // Puedes añadir validaciones si los totales finales no cuadran como esperas:
  //   // if (Math.abs(finalTotalPrincipalPaid - loanAmount) > 0.01) {
  //   //   console.warn("Discrepancia en el total de capital pagado.");
  //   // }
  //   // if (Math.abs(finalTotalInterestAccrued - totalInterestFixed) > 0.01) {
  //   //   console.warn("Discrepancia en el total de interés pagado.");
  //   // }
  //   // if (Math.abs(finalTotalPaymentsMade - totalAmountToPayByClient) > 0.01) {
  //   //   console.warn("Discrepancia en el total de pagos realizados.");
  //   // }

  //   return schedule;
  // }

  private generateAmortizationSchedule(
    loanAmount: number,
    termMonths: number,
    annualInterestRate: number,
    startDate: Date,
    loanId: number,
    createdById: number,
    termType: 'Plazos' | 'Cuotas' = 'Plazos',
  ): Omit<
    LoanAmortizationSchedule,
    | 'id'
    | 'paymentDate'
    | 'paidAmount'
    | 'accountingEntryId'
    | 'createdAt'
    | 'updatedAt'
    | 'updatedById'
  >[] {
    // 1. Cálculo del interés total fijo
    const totalInterestFixed = (loanAmount * annualInterestRate) / 100;
    const totalAmountToPayByClient = loanAmount + totalInterestFixed;

    // 2. Número total de cuotas
    const totalInstallments = termMonths;

    // 3. Componentes exactos por cuota
    const installmentAmountExact = totalAmountToPayByClient / totalInstallments;
    const interestComponentExact = totalInterestFixed / totalInstallments;
    const principalComponentExact = loanAmount / totalInstallments;

    // 4. Función auxiliar: último día del mes
    const getLastDayOfMonth = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // 5. Función auxiliar: siguiente fecha quincenal
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

    // 6. Determinar la primera fecha de pago
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

    // 7. Armar el cronograma
    const schedule: Omit<
      LoanAmortizationSchedule,
      | 'id'
      | 'paymentDate'
      | 'paidAmount'
      | 'accountingEntryId'
      | 'createdAt'
      | 'updatedAt'
      | 'updatedById'
    >[] = [];

    let remainingPrincipalBalance = loanAmount;

    for (let i = 1; i <= totalInstallments; i++) {
      let principal = principalComponentExact;
      let interest = interestComponentExact;
      let total = installmentAmountExact;

      if (i === totalInstallments) {
        principal = remainingPrincipalBalance;
        total = principal + interest;
      }

      remainingPrincipalBalance -= principal;

      schedule.push({
        loanId,
        installmentNumber: i,
        dueDate: new Date(nextDueDate),
        principalAmount: parseFloat(principal.toFixed(6)),
        interestAmount: parseFloat(interest.toFixed(6)),
        totalInstallmentAmount: parseFloat(total.toFixed(6)),
        principalBalancePending: parseFloat(
          remainingPrincipalBalance.toFixed(6),
        ),
        paymentStatus: PaymentStatusEnum.PENDING,
        createdById,
      });

      // 8. Calcular la siguiente fecha
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

  async request(
    createLoanDto: CreateLoanDto,
    userId: number,
  ): Promise<{ id: number; customReference: string | null }> {
    const {
      associateId,
      requestedAmount,
      loanTypeId,
      startDate,
      requestDate,
      interestRate,
      termType,
      termUnits,
    } = createLoanDto;

    const [companyData] = await this.db
      .select({ id: company.id })
      .from(company);

    // Verificar si existe un préstamo duplicado con las mismas características
    const existingLoan = await this.db
      .select()
      .from(loans)
      .where(
        and(
          eq(loans.associateId, associateId),
          eq(loans.requestedAmount, requestedAmount.toString()),
          eq(loans.loanTypeId, loanTypeId),
          eq(loans.status, LoanStatusEnum.REQUESTED),
        ),
      );

    if (existingLoan.length > 0) {
      throw new InternalServerErrorException(
        'A loan with the same characteristics already exists.',
      );
    }

    // Verificar si el asociado tiene un préstamo aprobado
    const activeLoan = await this.db
      .select()
      .from(loans)
      .where(
        and(
          eq(loans.associateId, associateId),
          eq(loans.status, LoanStatusEnum.APPROVED),
        ),
      );

    if (activeLoan.length > 0) {
      throw new InternalServerErrorException(
        'The member already has an approved loan.',
      );
    }

    const [associate] = await this.db
      .select({
        isPayrollCredit: associates.isPayrollCredit,
        balance: associateHaberesBalance.haberesBalance,
        associateAccountId: associateAccounts.id,
      })
      .from(associates)
      .where(eq(associates.id, associateId))
      .leftJoin(
        associateAccounts,
        eq(associateAccounts.associateId, associateId),
      )
      .leftJoin(
        associateHaberesBalance,
        eq(associateHaberesBalance.associateAccountId, associateAccounts.id),
      );

    // verifica si el asociado tiene un credinomina activo
    if (associate.isPayrollCredit) {
      throw new InternalServerErrorException('has an active payroll credit.');
    }

    const maxAllowedAmount = this.calculatePercentage(
      Number(associate?.balance ?? 0),
      80,
    );

    //valida  que le monto solicitado sea menor al 80 de sus haberes disponible
    if (Number(requestedAmount) > maxAllowedAmount) {
      throw new InternalServerErrorException(
        'Your available funds are less than the requested amount.',
      );
    }

    const [getLoanTypes] = await this.db
      .select()
      .from(loanTypes)
      .where(eq(loanTypes.id, loanTypeId));
    const finalDate = this.addMonthsToDate(
      new Date(startDate),
      termUnits ?? getLoanTypes.termUnits,
    );

    const setting = await this.db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'MONEDA'),
    });

    // Start transaction
    const newLoan = await this.db.transaction(async (tx) => {
      // Insert into loans table
      const [insertedLoan] = await tx
        .insert(loans)
        .values({
          ...createLoanDto,
          companyId: Number(companyData.id),
          requestedAmount: String(requestedAmount),
          status: LoanStatusEnum.REQUESTED,
          startDate: new Date(startDate).toISOString(),
          requestDate: new Date(requestDate).toISOString(),
          endDate: finalDate.toISOString(),
          overdraftAmount: String(createLoanDto.overdraftAmount) ?? null,
          currencyCode: setting?.value === '1' ? 'VES' : 'USD',
          loanModality: createLoanDto.loanModality as loanModalityTypeEnum,
          termType: termType ?? getLoanTypes.termType,
          termUnits: termUnits ?? getLoanTypes.termUnits,
          interestRate: interestRate
            ? String(interestRate)
            : String(getLoanTypes.interestRate),
          createdById: userId,
          updatedById: userId,
        })
        .returning({
          id: loans.id,
          customReference: loans.customReference,
        });

      // Save initial status history
      await tx.insert(loanStatusHistory).values({
        loanId: insertedLoan.id,
        status: LoanStatusEnum.REQUESTED,
        changedAt: new Date(),
        changedByUserId: userId,
        comment: 'Loan requested',
      });

      return insertedLoan;
    });

    return { id: newLoan.id, customReference: newLoan.customReference };
  }

  async approve(
    id: number,
    userId: number,
  ): Promise<{ id: number; customReference: string | null }> {
    const loan = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(loans)
        .where(eq(loans.id, id))
        .for('update');
      if (!row) throw new NotFoundException('Loan not found');
      if (row.status !== LoanStatusEnum.REQUESTED)
        throw new BadRequestException('Only REQUESTED loans can be approved');
      return row;
    });

    const {
      associateId,
      requestedAmount,
      loanTypeId,
      startDate,
      termType,
      termUnits,
      interestRate,
    } = loan;

    // Re-validate conditions
    const activeLoan = await this.db
      .select()
      .from(loans)
      .where(
        and(
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

    const [associate] = await this.db
      .select({
        isPayrollCredit: associates.isPayrollCredit,
        balance: associateHaberesBalance.haberesBalance,
        associateAccountId: associateAccounts.id,
      })
      .from(associates)
      .where(eq(associates.id, associateId))
      .leftJoin(
        associateAccounts,
        eq(associateAccounts.associateId, associateId),
      )
      .leftJoin(
        associateHaberesBalance,
        eq(associateHaberesBalance.associateAccountId, associateAccounts.id),
      );

    if (associate.isPayrollCredit) {
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

    // Calculations
    const setting = await this.db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'MONEDA'),
    });
    const entryDate = new Date().toISOString().split('T')[0];
    const exchangeRateData = await this.db.query.exchangeRates.findFirst({
      where: eq(exchangeRates.date, entryDate),
    });

    const [getLoanTypes] = await this.db
      .select()
      .from(loanTypes)
      .where(eq(loanTypes.id, loanTypeId));

    const annualInterestRate = interestRate
      ? parseFloat(interestRate)
      : parseFloat(getLoanTypes.interestRate);
    const term = termUnits ?? getLoanTypes.termUnits;
    const expensePercentage = parseFloat(
      getLoanTypes.administrativeExpensePercentage ?? '0',
    );
    const percentageInterest =
      (Number(requestedAmount) * annualInterestRate) / 100;

    let totalQuota = 0;
    let totalInterest = 0;
    let installmentAmount = 0;
    let totalPayable = 0;
    let totalDisbursed = 0;
    let totalTerm = 0;

    if (termType === 'Plazos') {
      totalTerm = term / 2;
    } else {
      totalTerm = term;
    }

    if (setting && setting.value === 'USD' && exchangeRateData) {
      totalQuota =
        (Number(requestedAmount) + percentageInterest) /
        totalTerm /
        Number(exchangeRateData.rate);
      totalInterest =
        (Number(requestedAmount) * annualInterestRate) /
        100 /
        Number(exchangeRateData.rate);
      installmentAmount =
        (Number(requestedAmount) * expensePercentage) /
        100 /
        Number(exchangeRateData.rate);
      totalPayable =
        (Number(requestedAmount) + totalInterest) /
        Number(exchangeRateData.rate);
      totalDisbursed =
        (Number(requestedAmount) - installmentAmount) /
        Number(exchangeRateData.rate);
    } else {
      totalQuota = (Number(requestedAmount) + percentageInterest) / totalTerm;
      totalInterest = (Number(requestedAmount) * annualInterestRate) / 100;
      installmentAmount = (Number(requestedAmount) * expensePercentage) / 100;
      totalPayable = Number(requestedAmount) + totalInterest;
      totalDisbursed = Number(requestedAmount) - installmentAmount;
    }

    const customReference =
      await this.generateCodeService.generateNextReference('PRE');
    const approvalDate = new Date();
    const finalDate = this.addMonthsToDate(
      new Date(startDate!),
      termUnits ?? getLoanTypes.termUnits,
    );

    // Transaction for approval
    const result = await this.db.transaction(async (tx) => {
      const [loanUpdated] = await tx
        .update(loans)
        .set({
          status: LoanStatusEnum.APPROVED,
          approvalDate: approvalDate.toISOString(),
          customReference: customReference,
          approvedByUserId: userId,
          endDate: finalDate.toISOString(),
          totalInterest: String(totalInterest.toFixed(6)),
          installmentAmount:
            termType === 'Plazos'
              ? String((totalQuota / 2).toFixed(6))
              : String(totalQuota.toFixed(6)),
          expensesAmount: String(installmentAmount.toFixed(6)),
          totalPayable: String(totalPayable.toFixed(6)),
          disbursedAmount: String(totalDisbursed.toFixed(6)),
          approvedAmount: String(requestedAmount),
        })
        .where(eq(loans.id, id))
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
        Number(requestedAmount),
        term,
        annualInterestRate,
        approvalDate,
        id,
        userId,
        (termType ? termType : 'Plazos') as 'Plazos' | 'Cuotas',
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

      // Audit log
      await this.auditLogsService.create({
        action: 'UPDATE' as ActionEnumAudit,
        area: 'PRESTAMOS',
        description: 'APROBACION DE PRESTAMO',
        recordId: String(id),
        tableName: 'loans',
        userId: Number(userId),
      });

      return loanUpdated;
    });

    return { id: result.id, customReference: result.customReference ?? null };
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
        termType: loans.termType,
        termUnits: loans.termUnits,
        interestRate: loans.interestRate,
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
        requestedAmount: Number(loan.requestedAmount).toFixed(2),
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
      .where(eq(loans.id, id))
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
    const associate = await this.db
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
      .where(eq(associates.cedula, cedula));

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

    const associateAccount = await this.db
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
          ne(loans.status, LoanStatusEnum.CANCELLED),
          ne(loans.status, LoanStatusEnum.REJECTED),
        ),
      );

    const [{ count: totalCredit }] = await this.db
      .select({
        count: count(),
      })
      .from(schema.credits)
      .where(
        and(
          eq(schema.credits.associateId, associate[0].id),
          ne(schema.credits.status, CreditStatusEnum.PAID),
          ne(schema.credits.status, CreditStatusEnum.REQUESTED),
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
        balance: Number(associateAccount[0].balance).toFixed(2),
        requestedAprrobed:
          result.length !== 0 ? result[0].requestedAprrobed : null,
      },
      totalLoans: total,
      totalCredits: totalCredit,
    };
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

    if (existingLoan[0].status !== 'REQUESTED') {
      throw new InternalServerErrorException(
        'A loan with a status other than requested cannot be updated.',
      );
    }

    const setting = await this.db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'MONEDA'),
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
    const annualInterestRate = updateLoanDto.interestRate
      ? parseFloat(updateLoanDto.interestRate.toString())
      : parseFloat(getLoanTypes.interestRate); // Tasa de interés anual
    const term = updateLoanDto.termUnits ?? getLoanTypes.termUnits; // Plazo en meses
    const expensePercentage = parseFloat(
      getLoanTypes.administrativeExpensePercentage ?? '0',
    ); //  Tasa Porcentaje de gastos administrativos
    const percentageInterest =
      ((updateLoanDto.requestedAmount ?? 0) * annualInterestRate) / 100; // Porcentaje de cuota

    let totalQuota = 0; //Cálculo del pago cuotas mesual
    let totalInterest = 0; //Cálculo del monto total de intereses
    let installmentAmount = 0; //total gasto administrativo
    let totalPayable = 0; //Cálculo del monto total a pagar
    let totalDisbursed = 0; //calculo desembolso
    let totalTerm = 0;
    if (getLoanTypes.termType === 'Plazos') {
      totalTerm = term / 2;
    } else {
      totalTerm = term;
    }
    if (setting && setting.value === 'USD' && exchangeRateData) {
      totalQuota =
        ((updateLoanDto?.requestedAmount ?? 0) + percentageInterest) /
        totalTerm /
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
        ((updateLoanDto?.requestedAmount ?? 0) + totalInterest) /
        Number(exchangeRateData.rate);
      totalDisbursed =
        ((updateLoanDto?.requestedAmount ?? 0) - installmentAmount) /
        Number(exchangeRateData.rate);
    } else {
      totalQuota =
        ((updateLoanDto?.requestedAmount ?? 0) + percentageInterest) /
        totalTerm;
      totalInterest =
        ((updateLoanDto?.requestedAmount ?? 0) * annualInterestRate) / 100;
      installmentAmount =
        ((updateLoanDto?.requestedAmount ?? 0) * expensePercentage) / 100;
      totalPayable = (updateLoanDto?.requestedAmount ?? 0) + totalInterest;
      totalDisbursed =
        (updateLoanDto?.requestedAmount ?? 0) - installmentAmount;
    }

    let customReference: string | null | undefined = undefined;
    let approvalDate: Date | null = null;
    const currentDate = new Date(); // Fecha actual
    const finalDate = this.addMonthsToDate(
      updateLoanDto?.startDate ?? currentDate,
      updateLoanDto?.termUnits ?? getLoanTypes.termUnits,
    ); //fecha finalizacion del pago

    // 2 & 3. Handle APPROVED status
    if (updateLoanDto?.status === LoanStatusEnum.APPROVED) {
      approvalDate = currentDate;
    }

    // 4. Actualizar el préstamo y la tabla de amortización en una transacción
    const updatedLoan = await this.db.transaction(async (tx) => {
      // Actualizar préstamo

      const [loanUpdated] = await tx
        .update(loans)
        .set({
          ...updateLoanDto,
          interestRate: updateLoanDto.interestRate
            ? String(updateLoanDto.interestRate)
            : null,
          associateId: Number(updateLoanDto.associateId),
          loanTypeId: Number(updateLoanDto.loanTypeId),
          loanModality: updateLoanDto?.loanModality,
          requestDate: updateLoanDto?.requestDate?.toISOString().split('T')[0],
          approvalDate: approvalDate?.toISOString().split('T')[0],
          disbursementDate: null,
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
              ? String(totalDisbursed)
              : undefined, // Usa undefined en vez de null
          startDate: updateLoanDto?.startDate?.toISOString().split('T')[0],
          endDate: finalDate.toISOString().split('T')[0],
          totalInterest:
            totalInterest !== null && totalInterest !== undefined
              ? String(totalInterest.toFixed(6))
              : undefined, // Usa undefined en vez de null
          totalPayable:
            totalPayable !== null && totalPayable !== undefined
              ? String(totalPayable.toFixed(6))
              : undefined, // Usa undefined en vez de null
          installmentAmount:
            totalQuota !== null && totalQuota !== undefined
              ? String(totalQuota.toFixed(6))
              : undefined, // Usa undefined en vez de null
          expensesAmount:
            installmentAmount !== null && installmentAmount !== undefined
              ? String(installmentAmount.toFixed(6))
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
          disbursedByUserId: null,
          notes: updateLoanDto.notes ?? null,
          currencyCode: setting?.value === '1' ? 'VES' : 'USD',
          exchangeRateId: setting?.value === '2' ? exchangeRateData?.id : null,
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(loans.id, id))
        .returning({
          id: loans.id,
          customReference: loans.customReference,
        });

      if (!loanUpdated) {
        throw new InternalServerErrorException('Failed to update loan.');
      }

      //  // 6. Generate audit
      const paylodAuditData = {
        associateId: Number(updateLoanDto?.associateId),
        loanTypeId: Number(updateLoanDto?.loanTypeId),
        loanModality: updateLoanDto?.loanModality,
        requestDate: updateLoanDto?.requestDate?.toISOString().split('T')[0],
        approvalDate: approvalDate
          ? approvalDate.toISOString().split('T')[0]
          : null,
        disbursementDate: null,
        requestedAmount: updateLoanDto?.requestedAmount,
        approvedAmount: updateLoanDto?.requestedAmount,
        disbursedAmount: totalDisbursed,
        startDate: updateLoanDto?.startDate?.toISOString().split('T')[0],
        endDate: finalDate,
        totalInterest: String(totalInterest.toFixed(6)),
        totalPayable: String(totalPayable.toFixed(6)),
        installmentAmount: String(totalQuota.toFixed(6)),
        expensesAmount: installmentAmount.toString(),
        overdraftAmount: updateLoanDto?.overdraftAmount ?? null,
        previousLoanId: updateLoanDto?.previousLoanId ?? null,
        paymentMethod: updateLoanDto?.paymentMethod,
        disbursementAccountId: updateLoanDto?.disbursementAccountId,
        status: updateLoanDto?.status,
        approvedByUserId: userId,
        disbursedByUserId: null,
        notes: updateLoanDto?.notes ?? null,
        customReference: loanUpdated.customReference,
        updatedById: userId, // Set updatedById initially
      };

      //generate audit table register
      await this.auditLogsService.create({
        action: 'UPDATE' as ActionEnumAudit,
        area: 'PRESTAMOS',
        description: 'ACTUALIZACION DE PRESTAMO',
        recordId: String(loanUpdated.id),
        tableName: 'loans',
        userId: Number(userId),
        newData: [paylodAuditData],
      });

      if (updateLoanDto?.status === LoanStatusEnum.APPROVED) {
        // Generar y guardar nueva tabla de amortización
        const schedule = this.generateAmortizationSchedule(
          updateLoanDto.requestedAmount!,
          term,
          annualInterestRate,
          updateLoanDto.startDate!,
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

        // Registrar historial de estatus
        await tx.insert(loanStatusHistory).values({
          loanId: id,
          status: updateLoanDto.status!,
          changedAt: new Date(),
          changedByUserId: userId,
          comment: 'Loan updated',
        });
      }

      return loanUpdated;
    });

    return updatedLoan;
  }

  async remove(id: number, userId: number): Promise<{ message: string }> {
    const [existingLoan] = await this.db
      .select()
      .from(loans)
      .where(eq(loans.id, id));

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
      const loansRecord = await tx
        .update(loans)
        .set({ status: 'CANCELLED' })
        .where(eq(loans.id, id));
      // Registrar historial de estatus
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

      //generate audit table register
      await this.auditLogsService.create({
        action: 'CANCELED' as ActionEnumAudit,
        area: 'PRESTAMOS',
        description: 'CANCELACION DE PRESTAMO',
        recordId: String(id),
        tableName: 'loans',
        userId: Number(userId),
        previousData: loansRecord,
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

  async findCountAllLoans() {
    const totalLoansOrdinary = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .where(
        and(
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
      .where(eq(loans.status, LoanStatusEnum.PAID));

    const totalLoanInPaymet = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .where(eq(loans.status, LoanStatusEnum.IN_PAYMENT));

    return {
      totalLoansOrdinary: Number(totalLoansOrdinary[0].count),
      totalLoanSpecialQuotas: Number(totalLoanSpecialQuotas[0].count),
      totalLoanPaid: Number(totalLoanPaid[0].count),
      totalLoanInPaymet: Number(totalLoanInPaymet[0].count),
    };
  }

  async findLoanAprovee() {
    // Get paginated data
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
      .leftJoin(associates, eq(loans.associateId, associates.id))
      .leftJoin(loanTypes, eq(loans.loanTypeId, loanTypes.id))
      .where(eq(loans.status, LoanStatusEnum.APPROVED));

    return {
      data: data,
    };
  }

  async findAllByAssociate(associateId: number, filtersDto: PaginationDto) {
    const { page = 1, limit = 10 } = filtersDto;

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .leftJoin(loanTypes, eq(loans.loanTypeId, loanTypes.id))
      .leftJoin(
        schema.loanOutstandingBalance,
        eq(loans.id, schema.loanOutstandingBalance.loanId),
      )
      .where(eq(loans.associateId, associateId));

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
      .where(eq(loans.associateId, associateId))
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

      // Clamp progress between 0 and 10 and format to 2 decimal places
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

  async findLoanDetails(id: number) {
    const [loan] = await this.db
      .select({
        id: loans.id,
        associateId: loans.associateId,
        companyId: loans.companyId,
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
        createdById: loans.createdById,
        updatedById: loans.updatedById,
        associateName: associates.fullname,
        associateCedula: associates.cedula,
        loanTypeName: loanTypes.name,
      })
      .from(loans)
      .where(eq(loans.id, id))
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
