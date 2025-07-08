import { generateUniqueReference } from '@/common/utils/reference';
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
  NotFoundException,
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
    //private readonly settingsSystemService: SettingsSystemService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // --- Helper function to generate custom reference ---
  // private async generateCustomReference(): Promise<string> {
  //   // Fetch the current correlative number and increment it
  //   const key = 'correlativo_prestamo';
  //   try {
  //     const result = await this.db.transaction(async (tx) => {
  //       // Lock the row for update
  //       const setting = await tx.query.systemSettings.findFirst({
  //         where: eq(systemSettings.key, key),
  //         // Add forUpdate() if your Drizzle version supports it for row locking
  //         // Example: columns: {}, with: { forUpdate: true }
  //       });

  //       if (!setting) {
  //         throw new InternalServerErrorException(
  //           `System setting '${key}' not found.`,
  //         );
  //       }

  //       const currentNumber = parseInt(setting.value, 10);
  //       if (isNaN(currentNumber)) {
  //         throw new InternalServerErrorException(
  //           `Invalid correlative number format for '${key}'.`,
  //         );
  //       }

  //       const nextNumber = currentNumber + 1;
  //       const nextValue = nextNumber.toString().padStart(5, '0'); // Pad with leading zeros

  //       // Update the setting with the new value
  //       await tx
  //         .update(systemSettings)
  //         .set({ value: nextValue, updatedAt: new Date() }) // Assuming you have an updatedById field to set too
  //         .where(eq(systemSettings.id, setting.id));

  //       return nextValue; // Return the generated reference
  //     });
  //     return `PREST-${result}`; // Prefix the reference
  //   } catch (error) {
  //     console.error('Error generating custom reference:', error);
  //     throw new InternalServerErrorException(
  //       'Failed to generate custom loan reference.',
  //     );
  //   }
  // }

  // --- Helper function to generate amortization schedule ---
  private generateAmortizationSchedule(
    loanAmount: number, // Monto del préstamo solicitado (capital)
    termMonths: number, // Plazos en meses
    annualInterestRate: number, // Tasa de interés anual (para calcular interés total fijo)
    startDate: Date, // Fecha de inicio del préstamo (para determinar la primera cuota)
    loanId: number, // Identificador del préstamo
    createdById: number,
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
    // 1. Cálculo del interés total FIJO para todo el plazo
    const totalInterestFixed = (loanAmount * annualInterestRate) / 100; // Ej: 450 * 0.06 = 27

    // 2. Monto Total a Pagar por el Cliente (Capital + Interés Fijo)
    const totalAmountToPayByClient = loanAmount + totalInterestFixed; // Ej: 450 + 27 = 477

    // 3. Cálculo del número TOTAL de cuotas quincenales (asumiendo que termMonths ya es el total de cuotas)
    // Si termMonths es 24 (cuotas), entonces totalInstallments = 24
    const totalInstallments = termMonths;

    // 4. Cálculo de la Cuota Quincenal Fija (sin redondear inicialmente)
    const biweeklyPaymentExact = totalAmountToPayByClient / totalInstallments; // Ej: 477 / 24 = 19.875

    // 5. Componente de Interés FIJO por Cuota Quincenal (sin redondear inicialmente)
    const biweeklyInterestComponentExact =
      totalInterestFixed / totalInstallments; // Ej: 27 / 24 = 1.125

    // 6. Componente de Capital FIJO por Cuota Quincenal (sin redondear inicialmente)
    const biweeklyPrincipalComponentExact = loanAmount / totalInstallments; // Ej: 450 / 24 = 18.75

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

    let remainingPrincipalBalance = loanAmount; // Saldo de capital restante (con alta precisión)
    let totalInterestAccrued = 0; // Interés total acumulado para verificación
    let totalPrincipalPaid = 0; // Capital total pagado para verificación
    let totalPaymentsMade = 0; // Pagos totales realizados para verificación

    let currentCalculationDate = new Date(startDate); // Fecha de cálculo actual

    // Función auxiliar para obtener el último día de un mes
    const getLastDayOfMonth = (year: number, month: number): number => {
      return new Date(year, month + 1, 0).getDate();
    };

    // Función auxiliar para determinar la fecha de vencimiento quincenal
    const getNextBiweeklyDueDate = (
      currentDate: Date,
      isFirstHalf: boolean, // true para el 16, false para el 30/28
    ): Date => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); // 0-11

      let day: number;
      let targetMonth = month;
      let targetYear = year;

      if (isFirstHalf) {
        if (currentDate.getDate() > 16) {
          targetMonth = month + 1;
          if (targetMonth > 11) {
            targetMonth = 0;
            targetYear++;
          }
        }
        day = 16;
      } else {
        if (currentDate.getDate() > getLastDayOfMonth(year, month) - 1) {
          // Lógica revisada para determinar si ya pasó el día de fin de mes
          targetMonth = month + 1;
          if (targetMonth > 11) {
            targetMonth = 0;
            targetYear++;
          }
        }
        day = getLastDayOfMonth(targetYear, targetMonth);
      }

      const nextDate = new Date(targetYear, targetMonth, day);
      nextDate.setHours(0, 0, 0, 0); // Asegurar hora al inicio del día
      return nextDate;
    };

    // Determinar la primera fecha de pago
    let nextDueDate: Date;
    if (startDate.getDate() <= 15) {
      nextDueDate = getNextBiweeklyDueDate(startDate, false); // Es la segunda mitad del mes actual (fin de mes)
    } else {
      nextDueDate = getNextBiweeklyDueDate(startDate, true); // Es la primera mitad del siguiente mes (día 16)
    }

    for (
      let installmentCounter = 1;
      installmentCounter <= totalInstallments;
      installmentCounter++
    ) {
      let principalComponentForInstallment = biweeklyPrincipalComponentExact;
      let interestComponentForInstallment = biweeklyInterestComponentExact;
      let totalInstallmentAmountForInstallment = biweeklyPaymentExact;

      // --- Ajuste para la ÚLTIMA cuota ---
      if (installmentCounter === totalInstallments) {
        // Ajustar el capital de la última cuota para que el saldo sea exactamente 0
        principalComponentForInstallment = remainingPrincipalBalance;

        // La cuota total es la suma de este capital ajustado y el interés.
        // Aquí puedes decidir si el interés de la última cuota también se ajusta si hay una desviación muy pequeña,
        // o si solo el capital absorbe la diferencia.
        // Para un interés fijo por cuota, es más común que el capital sea el que "cuadre" el saldo.
        totalInstallmentAmountForInstallment =
          principalComponentForInstallment + interestComponentForInstallment;

        // Opcional: Asegurarse de que el monto total sea exactamente totalAmountToPayByClient
        // Este paso es más para verificación si se hicieron ajustes complejos.
        // En tu caso de interés fijo, `totalInterestFixed` ya es exacto.
        // Si `biweeklyPaymentExact` y `biweeklyInterestComponentExact` ya se calcularon con alta precisión,
        // la suma final debería ser correcta.
      }

      // Se resta el componente de capital del saldo pendiente
      remainingPrincipalBalance -= principalComponentForInstallment;

      // Acumular totales (sin redondear aquí)
      totalPrincipalPaid += principalComponentForInstallment;
      totalInterestAccrued += interestComponentForInstallment;
      totalPaymentsMade += totalInstallmentAmountForInstallment;

      schedule.push({
        loanId,
        installmentNumber: installmentCounter,
        dueDate: new Date(nextDueDate), // Clonar la fecha
        // --- Redondeo FINAL al exportar para la base de datos o visualización ---
        principalAmount: parseFloat(
          principalComponentForInstallment.toFixed(6),
        ),
        interestAmount: parseFloat(interestComponentForInstallment.toFixed(6)),
        totalInstallmentAmount: parseFloat(
          totalInstallmentAmountForInstallment.toFixed(6),
        ),
        // El saldo pendiente del principal debe ser 0 para la última cuota,
        // pero debe reflejar el saldo exacto para las intermedias, redondeado solo al guardar/mostrar.
        principalBalancePending: parseFloat(
          remainingPrincipalBalance.toFixed(6),
        ),
        paymentStatus: PaymentStatusEnum.PENDING,
        createdById: createdById,
      });

      // Calcular la PRÓXIMA fecha de vencimiento
      if (nextDueDate.getDate() === 16) {
        nextDueDate = getNextBiweeklyDueDate(nextDueDate, false);
      } else {
        nextDueDate = getNextBiweeklyDueDate(nextDueDate, true);
      }
    }

    // --- Verificaciones finales para asegurar la precisión total ---
    // Estos `toFixed(2)` son solo para la verificación, no para los cálculos internos
    // const finalTotalInterestAccrued = parseFloat(totalInterestAccrued.toFixed(6));
    // const finalTotalPrincipalPaid = parseFloat(totalPrincipalPaid.toFixed(6));
    // const finalTotalPaymentsMade = parseFloat(totalPaymentsMade.toFixed(6));

    // Opcional: Comprobaciones de depuración
    // console.log('Total Capital Calculado:', finalTotalPrincipalPaid);
    // console.log('Total Intereses Calculados:', finalTotalInterestAccrued);
    // console.log('Suma Total Cuotas Calculadas:', finalTotalPaymentsMade);
    // console.log('Capital original:', loanAmount);
    // console.log('Interés Total original:', totalInterestFixed);
    // console.log('Monto Total a Pagar original:', totalAmountToPayByClient);

    // Puedes añadir validaciones si los totales finales no cuadran como esperas:
    // if (Math.abs(finalTotalPrincipalPaid - loanAmount) > 0.01) {
    //   console.warn("Discrepancia en el total de capital pagado.");
    // }
    // if (Math.abs(finalTotalInterestAccrued - totalInterestFixed) > 0.01) {
    //   console.warn("Discrepancia en el total de interés pagado.");
    // }
    // if (Math.abs(finalTotalPaymentsMade - totalAmountToPayByClient) > 0.01) {
    //   console.warn("Discrepancia en el total de pagos realizados.");
    // }

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

    let totalQuota = 0; //Cálculo del pago cuotas mesual
    let totalInterest = 0; //Cálculo del monto total de intereses
    let installmentAmount = 0; //total gasto administrativo
    let totalPayable = 0; //Cálculo del monto total a pagar
    let totalDisbursed = 0; // calculo del monto a desembolsar
    if (setting && setting.value === 'USD' && exchangeRateData) {
      totalQuota =
        (requestedAmount + percentageInterest) /
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
        (requestedAmount + totalInterest) / Number(exchangeRateData.rate);
      totalDisbursed =
        (requestedAmount - installmentAmount) / Number(exchangeRateData.rate);
    } else {
      totalQuota = (requestedAmount + percentageInterest) / term;
      totalInterest = (requestedAmount * annualInterestRate) / 100;
      installmentAmount = (requestedAmount * expensePercentage) / 100;
      totalPayable = requestedAmount + totalInterest;
      totalDisbursed = requestedAmount - installmentAmount;
    }

    let customReference: string | null = null;
    let approvalDate: Date | null = null;
    const currentDate = new Date(); // Fecha actual
    const finalDate = this.addMonthsToDate(startDate, getLoanTypes.termUnits); //fecha finalizacion del pago
    customReference = generateUniqueReference();

    // 2 & 3. Handle APPROVED status
    if (
      status !== LoanStatusEnum.REQUESTED &&
      status !== LoanStatusEnum.REJECTED
    ) {
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
          disbursedAmount: totalDisbursed,
          startDate: startDate.toISOString().split('T')[0],
          endDate: finalDate,
          totalInterest: String(totalInterest.toFixed(6)),
          totalPayable: String(totalPayable.toFixed(6)),
          installmentAmount: String(totalQuota.toFixed(6)),
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

      // 6. Generate audit
      const paylodAuditData = {
        associateId: Number(associateId),
        companyId: Number(requestCompanyId.id),
        loanTypeId: Number(loanTypeId),
        loanModality: loanModality,
        requestDate: requestDate.toISOString().split('T')[0],
        approvalDate: approvalDate
          ? approvalDate.toISOString().split('T')[0]
          : null,
        disbursementDate: null,
        requestedAmount: requestedAmount,
        approvedAmount: requestedAmount,
        disbursedAmount: totalDisbursed,
        startDate: startDate.toISOString().split('T')[0],
        endDate: finalDate,
        totalInterest: String(totalInterest.toFixed(6)),
        totalPayable: String(totalPayable.toFixed(6)),
        installmentAmount: String(totalQuota.toFixed(6)),
        expensesAmount: installmentAmount.toString(),
        overdraftAmount: overdraftAmount ?? null,
        previousLoanId: previousLoanId ?? null,
        paymentMethod: paymentMethod,
        disbursementAccountId: disbursementAccountId,
        status: status,
        approvedByUserId: userId,
        disbursedByUserId: null,
        notes: notes ?? null,
        customReference: customReference,
        currencyCode: setting?.value === '1' ? 'VES' : 'USD',
        currencyRate: setting?.value === '2' ? exchangeRateData?.id : null,
        createdById: userId,
      };

      // generate audit table register
      await this.auditLogsService.create({
        action: 'INSERT' as ActionEnumAudit,
        area: 'PRESTAMOS',
        description: 'APROBACION DE PRESTAMO',
        recordId: String(newLoan.id),
        tableName: 'loans',
        userId: Number(userId),
        newData: [paylodAuditData],
      });

      // 5. Generate and save amortization schedule if APPROVED
      if (status === LoanStatusEnum.APPROVED) {
        const schedule = this.generateAmortizationSchedule(
          requestedAmount, // Monto del préstamo solicitado
          term, // Plazos en meses
          annualInterestRate, // Tasa de interés anual
          approvalDate || currentDate, // Fecha de inicio del préstamo
          newLoan.id, // Identificador del préstamo
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
              createdById: item.createdById,
            })),
          );
        }
      }
      return newLoan;
    });

    //6. generate movemet associate account
    // if (newLoan.id && status === LoanStatusEnum.DISBURSED) {
    //   const payloadMovementLoan = {
    //     associateAccountId: Number(associate.associateAccountId),
    //     movementType: 'LOAN_DISBURSEMENT_CREDIT' as AssociateMovementTypeEnum,
    //     amount: requestedAmount,
    //     currencyCode: 'VES' as CurrencyCodeEnum,
    //     transactionDate: approvalDate ? approvalDate : undefined,
    //     description: 'DESEMBOLSO DE PRESTAMO',
    //     referenceId: String(newLoan.id),
    //     referenceType: 'loans',
    //     referenceNumber: newLoan.customReference ?? undefined,
    //   };

    //   const payloadMovementLoanDebit = {
    //     associateAccountId: Number(associate.associateAccountId),
    //     movementType: 'LOAN_ADMIN_FEE_DEBIT' as AssociateMovementTypeEnum,
    //     amount: installmentAmount,
    //     currencyCode: 'VES' as CurrencyCodeEnum,
    //     transactionDate: approvalDate ? approvalDate : undefined,
    //     description: 'DEBITO GASTOS ADMINISTRATIVOS PRESTAMOS',
    //     referenceId: String(newLoan.id),
    //     referenceType: 'loans',
    //     referenceNumber: newLoan.customReference ?? undefined,
    //   };

    //   await this.associateAccountsMovementsService.create(
    //     userId,
    //     payloadMovementLoan,
    //   );

    //   await this.associateAccountsMovementsService.create(
    //     userId,
    //     payloadMovementLoanDebit,
    //   );
    // }

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

    let totalQuota = 0; //Cálculo del pago cuotas mesual
    let totalInterest = 0; //Cálculo del monto total de intereses
    let installmentAmount = 0; //total gasto administrativo
    let totalPayable = 0; //Cálculo del monto total a pagar
    let totalDisbursed = 0; //calculo desembolso
    if (setting && setting.value === 'USD' && exchangeRateData) {
      totalQuota =
        ((updateLoanDto?.requestedAmount ?? 0) + percentageInterest) /
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
        ((updateLoanDto?.requestedAmount ?? 0) + totalInterest) /
        Number(exchangeRateData.rate);
      totalDisbursed =
        ((updateLoanDto?.requestedAmount ?? 0) - installmentAmount) /
        Number(exchangeRateData.rate);
    } else {
      totalQuota =
        ((updateLoanDto?.requestedAmount ?? 0) + percentageInterest) / term;
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
      getLoanTypes.termUnits,
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
}
