import { generateUniqueReference } from '@/common/utils/reference';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import {
  associateAccounts,
  associates,
  auditLogs,
  company,
  creditAmortizationSchedule,
  credits,
  creditStatusHistory,
  creditsTypes,
  exchangeRates,
  systemSettings,
} from '@/database/index';
import { associateHaberesBalance } from '@/database/schema/views';
import { SettingsSystemService } from '@/features/core/settings-system/settings-system.service';
import {
  AssociateMovementTypeEnum,
  creditModalityTypeEnum,
  CreditStatusEnum,
  CurrencyCodeEnum,
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
import { AssociateAccountsMovementsService } from '../../associate-accounts-movements/associate-accounts-movements.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { FilterCreditManagementDto } from './dto/filter-credit-management.dto';
import { UpdateCreditDto } from './dto/update-credit.dto';
import { CreditAmortizationSchedule } from './entities/credit-amortization-schedule.entity';
import { stat } from 'fs';

@Injectable()
export class CreditManagementService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly settingsSystemService: SettingsSystemService,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
  ) {}

  // --- Helper function to generate custom reference ---
  // private async generateCustomReference(): Promise<string> {
  //   // Fetch the current correlative number and increment it
  //   const key = 'correlativo_credito';
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
  //     return `CREDIT-${result}`; // Prefix the reference
  //   } catch (error) {
  //     console.error('Error generating custom reference:', error);
  //     throw new InternalServerErrorException(
  //       'Failed to generate custom credit reference.',
  //     );
  //   }
  // }

  // --- Helper function to generate amortization schedule ---
  private generateAmortizationSchedule(
    creditAmount: number, // Monto del credito solicitado
    termMonths: number, // Plazos en meses
    annualInterestRate: number, // Tasa de interés anual
    startDate: Date, // Fecha de inicio del credito
    creditId: number, // Identificador del credito
    createdById: number,
  ): Omit<
    CreditAmortizationSchedule,
    | 'id'
    | 'paymentDate'
    | 'paidAmount'
    | 'accountingEntryId'
    | 'createdAt'
    | 'updatedAt'
    | 'updatedById'
  >[] {
    const totalInterestFixed = (creditAmount * annualInterestRate) / 100;
    //const totalAdministrativeFee = (creditAmount * administrativeFeeRate) / 100;
    const totalAmountToPayByClient = creditAmount + totalInterestFixed;
    const monthlyPayment = totalAmountToPayByClient / termMonths;
    const monthlyInterestComponent = totalInterestFixed / termMonths; // Convert annual to monthly
    const monthlyPrincipalComponent = creditAmount / termMonths;

    const schedule: Omit<
      CreditAmortizationSchedule,
      | 'id'
      | 'paymentDate'
      | 'paidAmount'
      | 'accountingEntryId'
      | 'createdAt'
      | 'updatedAt'
      | 'updatedById'
    >[] = [];
    let remainingBalance = creditAmount;
    let currentDueDate = new Date(startDate);
    currentDueDate.setMonth(currentDueDate.getMonth() + 1);

    for (let i = 1; i <= termMonths; i++) {
      let principalComponentForInstallment = monthlyPrincipalComponent;
      let interestComponentForInstallment = monthlyInterestComponent;
      let totalInstallmentAmountForInstallment = monthlyPayment;

      // Ajuste del último pago para evitar errores de redondeo
      // Aseguramos que el capital restante sea 0 después del último pago
      if (i === termMonths) {
        principalComponentForInstallment = remainingBalance; // El último capital es lo que queda
        // El interés sigue siendo fijo para esta cuota
        // La cuota total se ajusta para incluir el capital restante y el interés fijo
        totalInstallmentAmountForInstallment =
          principalComponentForInstallment + interestComponentForInstallment;
      }

      // Se resta el componente de capital del saldo pendiente
      remainingBalance -= principalComponentForInstallment;

      // Asegurarse de que el saldo no sea negativo debido a errores de coma flotante en el último pago
      if (remainingBalance < 0.005) {
        remainingBalance = 0;
      }

      schedule.push({
        creditId,
        installmentNumber: i,
        dueDate: new Date(currentDueDate), // Clonar para cada entrada
        principalAmount: parseFloat(
          principalComponentForInstallment.toFixed(6),
        ),
        interestAmount: parseFloat(interestComponentForInstallment.toFixed(6)),
        totalInstallmentAmount: parseFloat(
          totalInstallmentAmountForInstallment.toFixed(6),
        ),
        principalBalancePending: parseFloat(remainingBalance.toFixed(6)),
        paymentStatus: PaymentStatusEnum.PENDING, // Estado por defecto
        createdById: createdById,
      });

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
    dto: CreateCreditDto,
    userId: number,
  ): Promise<{ id: number; customReference: string | null }> {
    const {
      associateId,
      requestedAmount,
      status,
      requestDate,
      startDate,
      creditTypeId,
      previousCreditId,
      notes,
      creditModality,
      overdraftAmount,
      commercialHouseId,
      invoiceNumber,
      endDate,
    } = dto;

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
    const existingCredit = await this.db
      .select()
      .from(credits)
      .where(
        and(
          eq(credits.associateId, associateId),
          eq(credits.requestedAmount, requestedAmount.toString()),
          eq(credits.creditTypeId, creditTypeId),
          eq(credits.status, status),
        ),
      );

    if (existingCredit.length > 0) {
      throw new InternalServerErrorException(
        'A credit with the same characteristics already exists.',
      );
    }

    // Verificar si el asociado tiene un credito aprobado
    const activeCredit = await this.db
      .select()
      .from(credits)
      .where(
        or(
          and(
            eq(credits.associateId, associateId),
            eq(credits.status, CreditStatusEnum.APPROVED),
          ),
        ),
      );

    if (activeCredit.length > 0) {
      throw new InternalServerErrorException(
        'The member already has an approved in the payment process.',
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
      ).leftJoin(associateHaberesBalance, eq(associateHaberesBalance.associateAccountId, associateAccounts.id));;

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

    //Fetch type Credit
    const [getCreditTypes] = await this.db
      .select()
      .from(creditsTypes)
      .where(eq(creditsTypes.id, creditTypeId));

    // 1. Perform calculations
    // Using the standard formula for annuity Credit payments
    const annualInterestRate = parseFloat(getCreditTypes.interestRate); // Tasa de interés anual
    const term = getCreditTypes.termUnits; // Plazo en meses
    const expensePercentage = parseFloat(
      getCreditTypes.administrativeExpensePercentage ?? '0',
    ); //  Tasa Porcentaje de gastos administrativos
    const percentageInterest = (requestedAmount * annualInterestRate) / 100; // Porcentaje de cuota
    const percentageExpenses = (requestedAmount * expensePercentage) / 100; // Porcentaje de gastos

    let totalQuota = 0; //Cálculo del pago cuotas mesual
    let totalInterest = 0; //Cálculo del monto total de intereses
    let installmentAmount = 0; //total gasto administrativo
    let totalPayable = 0; //Cálculo del monto total a pagar
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
        (requestedAmount + totalInterest + installmentAmount) /
        Number(exchangeRateData.rate);
    } else {
      totalQuota =
        (requestedAmount + percentageInterest) / term;
      totalInterest = (requestedAmount * annualInterestRate) / 100;
      installmentAmount = (requestedAmount * expensePercentage) / 100;
      totalPayable = requestedAmount + totalInterest + installmentAmount;
    }

    let customReference: string | null = null;
    let approvalDate: Date | null = null;
    const currentDate = new Date(); // Fecha actual
    const finalDate = this.addMonthsToDate(startDate, getCreditTypes.termUnits); //fecha finalizacion del pago

    // 2 & 3. Handle APPROVED status
    if (status !== CreditStatusEnum.REQUESTED) {
      customReference = generateUniqueReference();
      approvalDate = currentDate;
    }

    // Start transaction
    const newCredit = await this.db.transaction(async (tx) => {
      // Insert into Credit table
      const insertedCredit = await tx
        .insert(credits)
        .values({
          associateId: Number(associateId),
          companyId: Number(requestCompanyId.id),
          creditTypeId: Number(creditTypeId),
          creditModality: creditModality,
          requestDate: requestDate.toISOString().split('T')[0],
          approvalDate: approvalDate
            ? approvalDate.toISOString().split('T')[0]
            : null,
          requestedAmount: requestedAmount,
          approvedAmount: requestedAmount,
          disbursedAmount: requestedAmount,
          startDate: startDate.toISOString().split('T')[0],
          endDate: finalDate,
          totalInterest: String(totalInterest.toFixed(6)),
          totalPayable: String(totalPayable.toFixed(6)),
          installmentAmount: String(totalQuota.toFixed(6)),
          expensesAmount: installmentAmount.toString(),
          overdraftAmount: overdraftAmount ?? null,
          previousCreditId: previousCreditId ?? null,
          status: status,
          approvedByUserId: userId,
          notes: notes ?? null,
          customReference: customReference,
          currencyCode: setting?.value === '1' ? 'VES' : 'USD',
          currencyRate: setting?.value === '2' ? exchangeRateData?.id : null,
          commercialHouseId: Number(commercialHouseId),
          invoiceNumber: invoiceNumber,
          createdById: userId,
          updatedById: userId, // Set updatedById initially
        })
        .returning({
          id: credits.id,
          customReference: credits.customReference,
        });

      if (
        !insertedCredit ||
        !Array.isArray(insertedCredit) ||
        insertedCredit.length === 0
      ) {
        throw new InternalServerErrorException('Failed to create credit.');
      }
      const newCredit = insertedCredit[0];

      // 4. Save initial status history
      await tx.insert(creditStatusHistory).values({
        creditId: newCredit.id,
        status,
        changedAt: currentDate,
        changedByUserId: userId,
        comment: 'Credit created',
      });

      // 5. Generate and save amortization schedule if APPROVED
      if (status === CreditStatusEnum.APPROVED) {
        const schedule = this.generateAmortizationSchedule(
          requestedAmount, // Monto del préstamo solicitado
          term, // Plazos en meses
          annualInterestRate, // Tasa de interés anual
          approvalDate || currentDate, // Fecha de inicio del préstamo
          newCredit.id, // Identificador del préstamo
          userId,
        );
        if (schedule.length > 0) {
          await tx.insert(creditAmortizationSchedule).values(
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

        // 6. Generate audit
        const paylodAuditData = {
          associateId: Number(associateId),
          companyId: Number(requestCompanyId.id),
          creditTypeId: Number(creditTypeId),
          creditModality: creditModality,
          requestDate: requestDate.toISOString().split('T')[0],
          approvalDate: approvalDate
            ? approvalDate.toISOString().split('T')[0]
            : null,
          requestedAmount: requestedAmount,
          approvedAmount: requestedAmount,
          disbursedAmount: requestedAmount,
          startDate: startDate.toISOString().split('T')[0],
          endDate: finalDate,
          totalInterest: String(totalInterest.toFixed(6)),
          totalPayable: String(totalPayable.toFixed(6)),
          installmentAmount: String(totalQuota.toFixed(6)),
          expensesAmount: installmentAmount.toString(),
          overdraftAmount: overdraftAmount ?? null,
          previousCreditId: previousCreditId ?? null,
          status: status,
          approvedByUserId: userId,
          notes: notes ?? null,
          customReference: customReference,
          currencyCode: setting?.value === '1' ? 'VES' : 'USD',
          currencyRate: setting?.value === '2' ? exchangeRateData?.id : null,
          commercialHouseId: Number(commercialHouseId),
          invoiceNumber: invoiceNumber,
          createdById: userId,
          updatedById: userId, // Set updatedById initially
        };

        await tx.insert(auditLogs).values({
          tableName: 'credits',
          recordId: String(newCredit.id),
          action: 'INSERT',
          userId: Number(userId),
          area: 'CREDITOS',
          description: 'CREDITO APROBADO',
          newData: [paylodAuditData],
        });
      }
      return {
        id: newCredit.id,
        customReference: newCredit.customReference,
        transation: true,
      };
    });

    if (newCredit.transation && status === CreditStatusEnum.APPROVED) {
      const payloadMovementCredits = {
        associateAccountId: Number(associate.associateAccountId),
        movementType:
          'COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT' as AssociateMovementTypeEnum,
        amount: requestedAmount,
        currencyCode: 'VES' as CurrencyCodeEnum,
        transactionDate: approvalDate ? approvalDate : undefined,
        description: 'APROBACION CREDITO',
        referenceId: String(newCredit.id),
        referenceType: 'credits',
        referenceNumber: newCredit.customReference ?? undefined,
      };

      const payloadMovementCreditsDebit = {
        associateAccountId: Number(associate.associateAccountId),
        movementType: 'CREDIT_ADMIN_FEE_DEBIT' as AssociateMovementTypeEnum,
        amount: installmentAmount,
        currencyCode: 'VES' as CurrencyCodeEnum,
        transactionDate: approvalDate ? approvalDate : undefined,
        description: 'DEBITO GASTOS ADMINISTRATIVOS POR CREDITO',
        referenceId: String(newCredit.id),
        referenceType: 'credits',
        referenceNumber: newCredit.customReference ?? undefined,
      };

      await this.associateAccountsMovementsService.create(
        userId,
        payloadMovementCredits,
      );

      await this.associateAccountsMovementsService.create(
        userId,
        payloadMovementCreditsDebit,
      );
    }

    // Convert to unknown first to safely cast to Credit type
    return newCredit;
  }

  async findAll(paginationDto: FilterCreditManagementDto) {
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
      searchConditions.push(eq(credits.status, status as CreditStatusEnum));
    }

    if (type !== 0) {
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

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${credits[sortBy as keyof typeof credits]} asc`
        : sql`${credits[sortBy as keyof typeof credits]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(credits)
      .leftJoin(associates, eq(credits.associateId, associates.id))
      .leftJoin(creditsTypes, eq(credits.creditTypeId, creditsTypes.id))
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.db
      .select({
        id: credits.id,
        associateId: credits.associateId,
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
        creditTypeId: credits.creditTypeId,
        creditModality: credits.creditModality,
        creditTypeName: creditsTypes.name,
        requestDate: credits.requestDate,
        approvalDate: credits.approvalDate,
        requestedAmount: credits.requestedAmount,
        startDate: credits.startDate,
        endDate: credits.endDate,
        totalInterest: credits.totalInterest,
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
      })
      .from(credits)
      .where(searchCondition)
      .orderBy(orderBy)
      .leftJoin(associates, eq(credits.associateId, associates.id))
      .leftJoin(creditsTypes, eq(credits.creditTypeId, creditsTypes.id))
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
      data: data.map((credit): any => ({
        ...credit,
        requestedAmount: Number(credit.requestedAmount).toFixed(2),
      })),
      meta,
    };
  }

  async findRequestByEdit(id: number) {
    // Get paginated data
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
      })
      .from(credits)
      .where(eq(credits.id, id))
      .leftJoin(associates, eq(credits.associateId, associates.id))
      .leftJoin(
        associateAccounts,
        eq(credits.associateId, associateAccounts.associateId),
      )
      .leftJoin(creditsTypes, eq(credits.creditTypeId, creditsTypes.id));

    const [{ count: total }] = await this.db
      .select({
        count: count(),
      })
      .from(credits)
      .where(
        and(
          eq(credits.associateId, data.associateId),
          ne(credits.status, CreditStatusEnum.PAID),
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
      creditTypeId: data.creditTypeId,
      creditModality: data.creditModality,
      creditTypeName: data.creditTypeName,
      requestDate: data.requestDate,
      approvalDate: data.approvalDate,
      requestedAmount: data.requestedAmount,
      startDate: data.startDate,
      endDate: data.endDate,
      totalInterest: data.totalInterest,
      totalPayable: data.totalPayable,
      expensesAmount: data.expensesAmount,
      overdraftAmount: data.overdraftAmount,
      previousCreditId: data.previousCreditId,
      status: data.status,
      approvedByUserId: data.approvedByUserId,
      notes: data.notes,
      customReference: data.customReference,
      currencyCode: data.currencyCode,
      exchangeRateId: data.exchangeRateId,
      totalCredits: total,
      invoiceNumber: data.invoiceNumber,
      commercialHouseId: data.commercialHouseId,
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
        .where(
          eq(associates.cedula, cedula),
        );

      	
      if (!associate.length) {
            throw new NotFoundException(`Associate with cedula ${cedula} not found`);
      }
       if (associate[0].status === 'INACTIVE') {
          throw new NotFoundException(  `Associate with cedula ${cedula} is inactive`);
        }

        if (associate[0].status === 'RETIRED') {
          throw new NotFoundException(  `Associate with cedula ${cedula} is retired`);
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
        .from(credits)
        .where(
          and(
            eq(credits.associateId, associate[0].id),
            ne(credits.status, CreditStatusEnum.PAID),
            ne(credits.status, CreditStatusEnum.REQUESTED),
          ),
        );

      return {
        associate: {
          ...associate[0],
          associateAccountId: associateAccount[0].associateAccountId,
          accountNumber: associateAccount[0].accountNumber,
          balance: Number(associateAccount[0].balance).toFixed(2)
        },
        totalCredits: total,
      };
  
  }

  findOne(id: number) {
    return `This action returns a #${id} Credit`;
  }

  async update(
    id: number,
    dto: UpdateCreditDto,
    userId: number,
  ): Promise<{ id: number; customReference: string | null }> {
    // 1. Obtener el préstamo actual

    const existingCredit = await this.db
      .select()
      .from(credits)
      .where(eq(credits.id, id));
    if (existingCredit.length === 0) {
      throw new InternalServerErrorException('Credit not found.');
    }

    const setting = await this.db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'moneda'),
    });
    const entryDate = new Date().toISOString().split('T')[0];
    const exchangeRateData = await this.db.query.exchangeRates.findFirst({
      where: eq(exchangeRates.date, entryDate),
    });

    // 2. Obtener datos relevantes para el cálculo
    const [getCreditTypes] = await this.db
      .select()
      .from(creditsTypes)
      .where(
        eq(creditsTypes.id, dto.creditTypeId ?? existingCredit[0].creditTypeId),
      );

    // 3. Calcular nuevos valores si corresponde
    // 1. Perform calculations
    // Using the standard formula for annuity Credit payments
    const annualInterestRate = parseFloat(getCreditTypes.interestRate); // Tasa de interés anual
    const term = getCreditTypes.termUnits; // Plazo en meses
    const expensePercentage = parseFloat(
      getCreditTypes.administrativeExpensePercentage ?? '0',
    ); //  Tasa Porcentaje de gastos administrativos
    const percentageInterest =
      ((dto.requestedAmount ?? 0) * annualInterestRate) / 100; // Porcentaje de cuota
    const percentageExpenses =
      ((dto.requestedAmount ?? 0) * expensePercentage) / 100; // Porcentaje de gastos

    let totalQuota = 0; //Cálculo del pago cuotas mesual
    let totalInterest = 0; //Cálculo del monto total de intereses
    let installmentAmount = 0; //total gasto administrativo
    let totalPayable = 0; //Cálculo del monto total a pagar
    if (setting && setting.value === 'USD' && exchangeRateData) {
      totalQuota =
        ((dto?.requestedAmount ?? 0) +
          percentageInterest) /
        term /
        Number(exchangeRateData.rate);
      totalInterest =
        ((dto?.requestedAmount ?? 0) * annualInterestRate) /
        100 /
        Number(exchangeRateData.rate);
      installmentAmount =
        ((dto?.requestedAmount ?? 0) * expensePercentage) /
        100 /
        Number(exchangeRateData.rate);
      totalPayable =
        ((dto?.requestedAmount ?? 0) + totalInterest + installmentAmount) /
        Number(exchangeRateData.rate);
    } else {
      totalQuota =
        ((dto?.requestedAmount ?? 0) +
          percentageInterest) /
        term;
      totalInterest = ((dto?.requestedAmount ?? 0) * annualInterestRate) / 100;
      installmentAmount =
        ((dto?.requestedAmount ?? 0) * expensePercentage) / 100;
      totalPayable =
        (dto?.requestedAmount ?? 0) + totalInterest + installmentAmount;
    }

    let customReference: string | null | undefined = undefined;
    let approvalDate: Date | null = null;
    const currentDate = new Date(); // Fecha actual
    const finalDate = this.addMonthsToDate(
      dto?.startDate ?? currentDate,
      getCreditTypes.termUnits,
    ); //fecha finalizacion del pago

    // 2 & 3. Handle APPROVED status
    if (dto?.status !== CreditStatusEnum.REQUESTED) {
      customReference = generateUniqueReference();
      approvalDate = currentDate;
    }

    // 4. Actualizar el préstamo y la tabla de amortización en una transacción
    const updatedCredit = await this.db.transaction(async (tx) => {
      // Actualizar préstamo

      const [creditUpdated] = await tx
        .update(credits)
        .set({
          ...dto,
          associateId: Number(dto.associateId),
          creditTypeId: Number(dto.creditTypeId),
          creditModality: dto?.creditModality,
          requestDate: dto?.requestDate?.toISOString().split('T')[0],
          approvalDate: approvalDate?.toISOString().split('T')[0],
          requestedAmount:
            dto.requestedAmount !== null && dto.requestedAmount !== undefined
              ? String(dto.requestedAmount)
              : undefined, // Usa undefined en vez de null
          startDate: dto?.startDate?.toISOString().split('T')[0],
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
            dto.overdraftAmount !== null && dto.overdraftAmount !== undefined
              ? String(dto.overdraftAmount)
              : undefined, // Usa undefined en vez de null
          previousCreditId: dto.previousCreditId ?? null,
          status: dto?.status,
          approvedByUserId: userId,
          notes: dto.notes ?? null,
          currencyCode: setting?.value === '1' ? 'VES' : 'USD',
          exchangeRateId: setting?.value === '2' ? exchangeRateData?.id : null,
          customReference: customReference,
          commercialHouseId: Number(dto.commercialHouseId),
          invoiceNumber: dto.invoiceNumber,
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(credits.id, id))
        .returning({
          id: credits.id,
          customReference: credits.customReference,
        });

      if (!creditUpdated) {
        throw new InternalServerErrorException('Failed to update credit.');
      }

      // Eliminar tabla de amortización anterior
      await tx
        .delete(creditAmortizationSchedule)
        .where(eq(creditAmortizationSchedule.creditId, id));

      // Generar y guardar nueva tabla de amortización
      const schedule = this.generateAmortizationSchedule(
        dto.requestedAmount!,
        term,
        annualInterestRate,
        dto.startDate!,
        id,
        userId,
      );
      if (schedule.length > 0) {
        await tx.insert(creditAmortizationSchedule).values(
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
      await tx.insert(creditStatusHistory).values({
        creditId: id,
        status: dto.status!,
        changedAt: new Date(),
        changedByUserId: userId,
        comment: 'Credit updated',
      });

      return creditUpdated;
    });

    return updatedCredit;
  }

  async remove(id: number): Promise<{ message: string }> {
    const [existingCredit] = await this.db
      .select()
      .from(credits)
      .where(eq(credits.id, id));

    if (!existingCredit) {
      throw new HttpException('Credit not found', HttpStatus.NOT_FOUND);
    }

    await this.db.delete(credits).where(eq(credits.id, id));
    return { message: 'Credit deleted successfully' };
  }

  async findCountAllCredits() {
    const totalCreditOrdinary = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(credits)
      .where(
        and(
          eq(credits.creditModality, creditModalityTypeEnum.ORDINARY),
          or(eq(credits.status, CreditStatusEnum.APPROVED)),
        ),
      );

    const totalCreditSpecialQuotas = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(credits)
      .where(
        and(
          eq(credits.creditModality, creditModalityTypeEnum.SPECIAL_QUOTAS),
          or(eq(credits.status, CreditStatusEnum.APPROVED)),
        ),
      );

    const totalCreditPaid = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(credits)
      .where(eq(credits.status, CreditStatusEnum.PAID));

    const totalCreditInPaymet = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(credits)
      .where(eq(credits.status, CreditStatusEnum.IN_PAYMENT));

    return {
      totalCreditOrdinary: Number(totalCreditOrdinary[0].count),
      totalCreditSpecialQuotas: Number(totalCreditSpecialQuotas[0].count),
      totalCreditPaid: Number(totalCreditPaid[0].count),
      totalCreditInPaymet: Number(totalCreditInPaymet[0].count),
    };
  }
}
