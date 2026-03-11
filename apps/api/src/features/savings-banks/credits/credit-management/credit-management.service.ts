import { PaginationDto } from '@/common/dto/pagination.dto';
import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
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
  loans,
  products,
  systemSettings,
} from '@/database/index';
import { associateHaberesBalance } from '@/database/schema/views';
import { InventoryMovementsService } from '@/features/administration/inventory/inventory-movements/inventory-movements.service';
import { SettingsSystemService } from '@/features/core/settings-system/settings-system.service';
import {
  AssociateMovementTypeEnum,
  creditModalityTypeEnum,
  CreditStatusEnum,
  CurrencyCodeEnum,
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
import { AssociateAccountsMovementsService } from '../../associate-accounts-movements/associate-accounts-movements.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { FilterCreditManagementDto } from './dto/filter-credit-management.dto';
import { CreditAmortizationSchedule } from './entities/credit-amortization-schedule.entity';

@Injectable()
export class CreditManagementService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly settingsSystemService: SettingsSystemService,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly generateCodeService: GenerateCodeService,
    private readonly inventoryMovementsService: InventoryMovementsService,
  ) {}

  // --- Helper function to generate amortization schedule ---
  private generateAmortizationSchedule(
    creditAmount: number,
    termMonths: number, // = nº de cuotas (quincenales o mensuales)
    annualInterestRate: number,
    startDate: Date,
    creditId: number,
    createdById: number,
    termType: 'Plazos' | 'Cuotas' = 'Plazos', // ← nuevo
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
    const totalAmountToPayByClient = creditAmount + totalInterestFixed;
    const totalInstallments = termMonths; // ya trae la cantidad correcta

    const principalComponentExact = creditAmount / totalInstallments;
    const interestComponentExact = totalInterestFixed / totalInstallments;
    const installmentAmountExact = totalAmountToPayByClient / totalInstallments;

    /* ---------- Helpers de fecha ---------- */
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

    /* ---------- Primera fecha de pago ---------- */
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

    /* ---------- Cronograma ---------- */
    const schedule: any[] = [];
    let remainingPrincipal = creditAmount;

    for (let i = 1; i <= totalInstallments; i++) {
      let principal = principalComponentExact;
      let interest = interestComponentExact;
      let total = installmentAmountExact;

      if (i === totalInstallments) {
        principal = remainingPrincipal;
        total = principal + interest;
      }

      remainingPrincipal -= principal;
      if (remainingPrincipal < 0.005) remainingPrincipal = 0;

      schedule.push({
        creditId,
        installmentNumber: i,
        dueDate: new Date(nextDueDate),
        principalAmount: parseFloat(principal.toFixed(6)),
        interestAmount: parseFloat(interest.toFixed(6)),
        totalInstallmentAmount: parseFloat(total.toFixed(6)),
        principalBalancePending: parseFloat(remainingPrincipal.toFixed(6)),
        paymentStatus: PaymentStatusEnum.PENDING,
        createdById,
      });

      /* Siguiente fecha */
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
  // private addMonthsToDate(date: Date, months: number): Date {
  //   const result = new Date(date);
  //   result.setMonth(result.getMonth() + months);
  //   return result;
  // }

  private addMonthsToDate(
    date: Date,
    term: number,
    termType: 'Cuotas' | 'Plazos',
  ): Date {
    const result = new Date(date);

    if (termType === 'Cuotas') {
      result.setMonth(result.getMonth() + term);
    } else {
      // PLAZOS: 15 días por cada plazo
      result.setDate(result.getDate() + term * 15);
    }
    return result;
  }

  async request(
    dto: CreateCreditDto,
    userId: number,
  ): Promise<{ id: number; customReference: string | null }> {
    /* 1.  Validaciones idénticas a tu create  */
    const {
      associateId,
      requestedAmount,
      creditTypeId,
      startDate,
      interestRate,
      termType,
      termUnits,
    } = dto;

    const [companyId] = await this.db.select({ id: company.id }).from(company);

    const setting = await this.db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'MONEDA'),
    });

    // Duplicado
    const dup = await this.db
      .select()
      .from(credits)
      .where(
        and(
          eq(credits.associateId, associateId),
          eq(credits.requestedAmount, requestedAmount.toString()),
          eq(credits.creditTypeId, creditTypeId),
          eq(credits.status, CreditStatusEnum.REQUESTED),
        ),
      );

    if (dup.length)
      throw new InternalServerErrorException('Duplicate request.');

    // Crédito ya aprobado
    const active = await this.db
      .select()
      .from(credits)
      .where(
        and(
          eq(credits.associateId, associateId),
          eq(credits.status, CreditStatusEnum.APPROVED),
        ),
      );

    if (active.length)
      throw new InternalServerErrorException('Member has approved credit.');

    // Payroll
    const [assoc] = await this.db
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

    if (assoc.isPayrollCredit)
      throw new InternalServerErrorException('Active payroll credit.');
    const avail = this.calculatePercentage(Number(assoc?.balance ?? 0), 80);
    if (Number(avail) < Number(requestedAmount))
      throw new InternalServerErrorException('Insufficient availability.');

    /* 2.  Solo REQUESTED  */
    const [creditType] = await this.db
      .select()
      .from(creditsTypes)
      .where(eq(creditsTypes.id, creditTypeId));
    const finalDate = this.addMonthsToDate(
      startDate,
      termUnits ?? creditType.termUnits,
      (termType ?? 'Plazos') as 'Cuotas' | 'Plazos',
    );

    const newCredit = await this.db.transaction(async (tx) => {
      const [ins] = await tx
        .insert(credits)
        .values({
          ...dto,
          companyId: Number(companyId.id),
          requestedAmount: String(requestedAmount),
          status: CreditStatusEnum.REQUESTED,
          startDate: startDate.toISOString(),
          requestDate: dto.requestDate.toISOString(),
          endDate: finalDate.toISOString(),
          overdraftAmount: String(dto.overdraftAmount) ?? null,
          commercialHouseId: Number(dto.commercialHouseId) ?? null,
          currencyCode:
            setting?.value === '1' ? 'VES' : ('USD' as CurrencyCodeEnum),
          creditModality: dto.creditModality as creditModalityTypeEnum,
          termType: termType ?? creditType.termType,
          termUnits: termUnits ?? creditType.termUnits,
          interestRate: interestRate
            ? String(interestRate)
            : String(creditType.interestRate),
          createdById: userId,
          updatedById: userId,
        })
        .returning({
          id: credits.id,
          customReference: credits.customReference,
        });

      await tx.insert(creditStatusHistory).values({
        creditId: ins.id,
        status: CreditStatusEnum.REQUESTED,
        changedByUserId: userId,
        comment: 'CREDIT REQUESTED',
      });

      if (dto?.creditItems && dto?.creditItems.length > 0) {
        await tx.insert(schema.creditItemSales).values(
          dto.creditItems.map((item) => ({
            days: item.days,
            itemId: item.itemId ?? 0,
            itemDescription: item.itemDescription ?? null,
            agreedSellingPrice: String(item.agreedSellingPrice),
            quantity: Number(item.quantity),
            itemType: item.itemType as 'PRODUCT' | 'SERVICE' | 'EXTERNAL',
            creditId: ins.id,
            deliveryStatus: 'COMMITTED' as 'COMMITTED' | 'DELIVERED',
          })),
        );
      }

      return ins;
    });

    return { id: newCredit.id, customReference: newCredit.customReference };
  }

  async approve(
    id: number,
    userId: number,
  ): Promise<{ id: number; customReference: string | null }> {
    /* 1.  Lock del registro  */
    const credit = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(credits)
        .where(eq(credits.id, id))
        .for('update');
      if (!row) throw new NotFoundException('Credit not found');
      if (row.status !== CreditStatusEnum.REQUESTED)
        throw new BadRequestException('Only REQUESTED credits can be approved');
      return row;
    });

    const creditSale = await this.db
      .select()
      .from(schema.creditItemSales)
      .where(eq(schema.creditItemSales.creditId, id));

    /* 2.  Repetir validaciones (mismas que create)  */
    const {
      associateId,
      requestedAmount,
      creditTypeId,
      startDate,
      currencyCode,
      commercialHouseId,
      interestRate,
      termType,
      termUnits,
    } = credit;

    // approved credit exists?
    const active = await this.db
      .select()
      .from(credits)
      .where(
        and(
          eq(credits.associateId, associateId),
          eq(credits.status, CreditStatusEnum.APPROVED),
          ne(credits.id, id), // excluir el propio
        ),
      );
    if (active.length)
      throw new InternalServerErrorException('Member has approved credit.');

    // payroll
    const [assoc] = await this.db
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
    if (assoc.isPayrollCredit)
      throw new InternalServerErrorException('Active payroll credit.');
    const avail = this.calculatePercentage(Number(assoc?.balance ?? 0), 80);
    if (Number(avail) < Number(requestedAmount))
      throw new InternalServerErrorException('Insufficient availability.');

    /* 3.  Cálculos (iguales que create)  */
    const setting = await this.db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, 'MONEDA'))
      .then((r) => r[0]);
    const entryDate = new Date().toISOString().split('T')[0];
    const exchangeRateData = await this.db.query.exchangeRates.findFirst({
      where: eq(exchangeRates.date, entryDate),
    });

    const [creditType] = await this.db
      .select()
      .from(creditsTypes)
      .where(eq(creditsTypes.id, creditTypeId));

    const annualInterestRate = interestRate
      ? parseFloat(interestRate)
      : parseFloat(creditType.interestRate);
    const term = termUnits ?? creditType.termUnits;
    const expensePct = Number(creditType.administrativeExpensePercentage ?? 0);

    const interest = (Number(requestedAmount) * annualInterestRate) / 100;
    const expenses = (Number(requestedAmount) * expensePct) / 100;

    let totalQuota = 0;
    let totalInterest = 0;
    let installmentAmount = 0;
    let totalPayable = 0;
    let totalTerm = 0;

    if (termType === 'Plazos') {
      totalTerm = term / 2;
    } else {
      totalTerm = term;
    }

    if (setting?.value === 'USD' && exchangeRateData) {
      const rate = Number(exchangeRateData.rate);
      totalQuota = (Number(requestedAmount) + interest) / totalTerm / rate;
      totalInterest = interest / rate;
      installmentAmount = expenses / rate;
      totalPayable =
        Number(requestedAmount) + totalInterest + installmentAmount;
    } else {
      totalQuota = (Number(requestedAmount) + interest) / totalTerm;
      totalInterest = interest;
      installmentAmount = expenses;
      totalPayable =
        Number(requestedAmount) + totalInterest + installmentAmount;
    }

    const customReference =
      await this.generateCodeService.generateNextReference('CRE');

    /* 4.  Transacción de aprobación  */
    const result = await this.db.transaction(async (tx) => {
      const credit = await tx
        .update(credits)
        .set({
          status: CreditStatusEnum.APPROVED,
          approvalDate: new Date().toISOString(),
          customReference: customReference,
          approvedByUserId: userId,
          totalInterest: String(totalInterest.toFixed(6)),
          installmentAmount:
            termType === 'Plazos'
              ? String((totalQuota / 2).toFixed(6))
              : String(totalQuota.toFixed(6)),
          expensesAmount: String(installmentAmount.toFixed(6)),
          totalPayable: String(totalPayable.toFixed(6)),
        })
        .where(eq(credits.id, id))
        .returning({
          id: credits.id,
          customReference: credits.customReference,
        });

      await tx
        .update(schema.creditItemSales)
        .set({
          deliveryStatus: 'DELIVERED',
        })
        .where(eq(schema.creditItemSales.creditId, id));

      await tx.insert(creditStatusHistory).values({
        creditId: id,
        status: CreditStatusEnum.APPROVED,
        changedByUserId: userId,
        comment: 'CREDIT APPROVED',
      });

      const startDateAsDate = startDate ? new Date(startDate) : new Date();

      const schedule = this.generateAmortizationSchedule(
        Number(requestedAmount),
        term,
        annualInterestRate,
        startDateAsDate,
        id,
        userId,
        (termType ? termType : 'Plazos') as 'Plazos' | 'Cuotas',
      );

      await tx.insert(creditAmortizationSchedule).values(
        schedule.map((s) => ({
          ...s,
          dueDate: s.dueDate.toISOString(),
          principalAmount: String(s.principalAmount),
          interestAmount: String(s.interestAmount),
          totalInstallmentAmount: String(s.totalInstallmentAmount),
          principalBalancePending: String(s.principalBalancePending),
        })),
      );

      //Moivmiento de inventario
      for (const item of creditSale) {
        if (item.itemType === 'PRODUCT') {
          await this.inventoryMovementsService.create(
            userId,
            {
              movementType: 'OUT',
              description: `Salida de producto por credito asociado N° ${credit[0].customReference}`,
              documentType: 'VENTA',
              documentNumber: credit[0].customReference ?? undefined,
              items: [
                {
                  itemId: item.itemId ?? 0,
                  itemType: 'PRODUCT',
                  quantity: item.quantity,
                  unitCost: Number(item.agreedSellingPrice),
                },
              ],
            },
            tx,
          );
        }
      }

      // Movimientos

      if (assoc?.associateAccountId) {
        await this.associateAccountsMovementsService.create(userId, {
          associateAccountId: assoc.associateAccountId,
          movementType:
            'COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT' as AssociateMovementTypeEnum,
          amount: Number(requestedAmount),
          currencyCode: currencyCode as CurrencyCodeEnum,
          transactionDate: new Date(),
          description: 'Crédito Aprobado',
          referenceId: String(id),
          referenceType: 'credits',
        });
        if (installmentAmount > 0) {
          await this.associateAccountsMovementsService.create(userId, {
            associateAccountId: assoc?.associateAccountId,
            movementType: 'CREDIT_ADMIN_FEE_DEBIT' as AssociateMovementTypeEnum,
            amount: installmentAmount,
            currencyCode: currencyCode as CurrencyCodeEnum,
            transactionDate: new Date(),
            description: `Gastos Administrativos por Crédito N°${customReference}`,
            referenceId: String(id),
            referenceType: 'credits',
          });
        }
      }

      await tx.insert(auditLogs).values({
        tableName: 'credits',
        recordId: String(id),
        action: 'UPDATE',
        userId,
        area: 'CREDITOS',
        description: `Crédito Aprobado N°${customReference}`,
      });

      return credit[0];
    });

    return { id: result.id, customReference: result.customReference ?? null };
  }

  async findAll(paginationDto: FilterCreditManagementDto) {
    const {
      page = 1,
      limit = 10,
      searchType = '',
      search = '',
      sortBy = 'id',
      sortOrder = 'desc',
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
        termType: credits.termType,
        termUnits: credits.termUnits,
        interestRate: credits.interestRate,
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
      termType: data.termType,
      termUnits: data.termUnits,
      interestRate: data.interestRate,
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
      .from(credits)
      .where(
        and(
          eq(credits.associateId, associate[0].id),
          ne(credits.status, CreditStatusEnum.PAID),
          ne(credits.status, CreditStatusEnum.REQUESTED),
        ),
      );

    const [{ count: totalLoans }] = await this.db
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

    return {
      associate: {
        ...associate[0],
        associateAccountId: associateAccount[0].associateAccountId,
        accountNumber: associateAccount[0].accountNumber,
        balance: Number(associateAccount[0].balance).toFixed(2),
      },
      totalCredits: total,
      totalLoans: totalLoans,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} Credit`;
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

  async findAllByAssociate(associateId: number, filtersDto: PaginationDto) {
    const { page = 1, limit = 10 } = filtersDto;

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(credits)
      .leftJoin(creditsTypes, eq(credits.creditTypeId, creditsTypes.id))
      .leftJoin(
        schema.creditOutstandingBalance,
        eq(credits.id, schema.creditOutstandingBalance.creditId),
      )
      .where(eq(credits.associateId, associateId));

    const totalCount = totalCountResult[0].count;
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
      })
      .from(credits)
      .leftJoin(creditsTypes, eq(credits.creditTypeId, creditsTypes.id))
      .leftJoin(
        schema.creditOutstandingBalance,
        eq(credits.id, schema.creditOutstandingBalance.creditId),
      )
      .where(eq(credits.associateId, associateId))
      .orderBy(desc(credits.requestDate));

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

    const creditsWithProgress = results.map((credit) => {
      const totalAmount = parseFloat(credit.creditAmount || '0');
      const outstanding = parseFloat(credit.outstandingBalance || '0');

      let progress = 0;
      if (totalAmount > 0) {
        const paidAmount = totalAmount - outstanding;
        progress = (paidAmount / totalAmount) * 10;
      }

      // Clamp progress between 0 and 10 and format to 2 decimal places
      const formattedProgress = Math.max(0, Math.min(10, progress)).toFixed(2);

      return {
        ...credit,
        creditAmount: totalAmount.toFixed(2),
        outstandingBalance: outstanding.toFixed(2),
        installmentAmount: parseFloat(credit.installmentAmount || '0').toFixed(
          2,
        ),
        progress: formattedProgress,
      };
    });

    return {
      data: creditsWithProgress,
      meta: {
        totalCount: Number(totalCount),
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async findCreditDetails(id: number) {
    const [credit] = await this.db
      .select({
        id: credits.id,
        associateId: credits.associateId,
        companyId: credits.companyId,
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
        createdAt: credits.createdAt,
        updatedAt: credits.updatedAt,
        createdById: credits.createdById,
        updatedById: credits.updatedById,
        associateName: associates.fullname,
        associateCedula: associates.cedula,
        creditTypeName: creditsTypes.name,
      })
      .from(credits)
      .where(eq(credits.id, id))
      .leftJoin(associates, eq(credits.associateId, associates.id))
      .leftJoin(creditsTypes, eq(credits.creditTypeId, creditsTypes.id));

    if (!credit) {
      throw new NotFoundException('Credit not found');
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
        id: schema.creditItemSales.id,
        creditId: schema.creditItemSales.creditId,
        itemType: schema.creditItemSales.itemType,
        itemId: schema.creditItemSales.itemId,
        quantity: schema.creditItemSales.quantity,
        agreedSellingPrice: schema.creditItemSales.agreedSellingPrice,
        saleDate: schema.creditItemSales.saleDate,
        deliveryStatus: schema.creditItemSales.deliveryStatus,
        days: schema.creditItemSales.days,
        itemName: products.name,
      })
      .from(schema.creditItemSales)
      .leftJoin(products, eq(products.id, schema.creditItemSales.itemId))
      .where(eq(schema.creditItemSales.creditId, id));

    const totalPaid = amortizationSchedule
      .filter((item) => item.paymentStatus === 'PAID')
      .reduce((acc, item) => acc + parseFloat(item.paidAmount || '0'), 0);

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
