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
} from '@/database/schema/tables/savings';
import { exchangeRates, moduleSettings } from '@/database/schema/tables/core';
import { products } from '@/database/schema/tables/inventory';
import { associateHaberesBalance } from '@/database/schema/views';
import { InventoryMovementsService } from '@/features/inventory/inventory-movements/inventory-movements.service';
import { AuditHelper } from '@/features/audit/audit-event.service';
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
import { AssociateAccountsMovementsService } from '../../parnerts/associate-accounts-movements/associate-accounts-movements.service';
import { CreateCreditDto, CreditItemDto } from './dto/credit.schema';
import { FilterCreditDto } from './dto/credit.schema';

@Injectable()
export class CreditManagementService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly generateCodeService: GenerateCodeService,
    private readonly inventoryMovementsService: InventoryMovementsService,
    private readonly auditHelper: AuditHelper,
  ) {}

  private addMonthsToDate(
    date: Date,
    term: number,
    termType: 'Cuotas' | 'Plazos',
  ): Date {
    const result = new Date(date);

    if (termType === 'Cuotas') {
      result.setMonth(result.getMonth() + term);
    } else {
      result.setDate(result.getDate() + term * 15);
    }
    return result;
  }

  private calculatePercentage(value: number, percentage: number): number {
    return (value * percentage) / 100;
  }

  private generateAmortizationSchedule(
    creditAmount: number,
    termMonths: number,
    annualInterestRate: number,
    startDate: Date,
    creditId: string,
    createdById: string,
    termType: 'Plazos' | 'Cuotas' = 'Plazos',
  ) {
    const totalInterestFixed = (creditAmount * annualInterestRate) / 100;
    const totalAmountToPayByClient = creditAmount + totalInterestFixed;
    const totalInstallments = termMonths;

    const principalComponentExact = creditAmount / totalInstallments;
    const interestComponentExact = totalInterestFixed / totalInstallments;
    const installmentAmountExact = totalAmountToPayByClient / totalInstallments;

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
    } = dto;

    const setting = await this.db.query.moduleSettings.findFirst({
      where: and(
        eq(moduleSettings.key, 'MONEDA'),
        eq(moduleSettings.tenantId, tenantId),
      ),
    });

    const dup = await this.db
      .select()
      .from(credits)
      .where(
        and(
          eq(credits.tenantId, tenantId),
          eq(credits.associateId, associateId),
          eq(credits.requestedAmount, requestedAmount.toString()),
          eq(credits.creditTypeId, creditTypeId),
          eq(credits.status, CreditStatusEnum.REQUESTED),
        ),
      );

    if (dup.length)
      throw new InternalServerErrorException('Duplicate request.');

    const active = await this.db
      .select()
      .from(credits)
      .where(
        and(
          eq(credits.tenantId, tenantId),
          eq(credits.associateId, associateId),
          eq(credits.status, CreditStatusEnum.APPROVED),
        ),
      );

    if (active.length)
      throw new InternalServerErrorException('Member has approved credit.');

    const [assoc] = await this.db
      .select({
        isPayrollCredit: associates.isPayrollCredit,
        balance: associateHaberesBalance.haberesBalance,
        associateAccountId: associateAccounts.id,
      })
      .from(associates)
      .where(and(
        eq(associates.id, associateId),
        eq(associates.tenantId, tenantId),
      ))
      .leftJoin(
        associateAccounts,
        eq(associateAccounts.associateId, associateId),
      )
      .leftJoin(
        associateHaberesBalance,
        eq(associateHaberesBalance.associateAccountId, associateAccounts.id),
      );

    if (assoc?.isPayrollCredit)
      throw new InternalServerErrorException('Active payroll credit.');
    const avail = this.calculatePercentage(Number(assoc?.balance ?? 0), 80);
    if (Number(avail) < Number(requestedAmount))
      throw new InternalServerErrorException('Insufficient availability.');

    const [creditType] = await this.db
      .select()
      .from(creditsTypes)
      .where(and(
        eq(creditsTypes.id, creditTypeId),
        eq(creditsTypes.tenantId, tenantId),
      ));

    const finalDate = this.addMonthsToDate(
      startDate,
      termUnits ?? creditType.termUnits,
      (termType ?? 'Plazos') as 'Cuotas' | 'Plazos',
    );

    const numericInterestRate = interestRate
      ? String(interestRate)
      : String(creditType.interestRate);

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
          endDate: finalDate.toISOString(),
          overdraftAmount: dto.overdraftAmount ? String(dto.overdraftAmount) : null,
          commercialHouseId: dto.commercialHouseId ?? null,
          currencyCode:
            setting?.value === '1' ? 'VES' : ('USD' as CurrencyCodeEnum),
          termType: termType ?? creditType.termType,
          termUnits: termUnits ?? creditType.termUnits,
          interestRate: numericInterestRate,
          notes: dto.notes ?? null,
          invoiceNumber: dto.invoiceNumber ?? null,
          previousCreditId: dto.previousCreditId ?? null,
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
        await tx.insert(creditItemSales).values(
          dto.creditItems.map((item: CreditItemDto) => ({
            tenantId,
            creditId: ins.id,
            itemId: Number(item.itemId ?? 0),
            itemDescription: item.itemDescription ?? null,
            agreedSellingPrice: String(item.agreedSellingPrice),
            quantity: Number(item.quantity),
            itemType: item.itemType as 'PRODUCT' | 'SERVICE' | 'EXTERNAL',
            deliveryStatus: 'COMMITTED' as 'COMMITTED' | 'DELIVERED',
            saleDate: item.saleDate.toISOString(),
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

  async approve(
    tenantId: string,
    userId: string,
    id: string,
  ): Promise<{ id: string; customReference: string | null }> {
    const credit = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(credits)
        .where(and(eq(credits.id, id), eq(credits.tenantId, tenantId)))
        .for('update');
      if (!row) throw new NotFoundException('Credit not found');
      if (row.status !== CreditStatusEnum.REQUESTED)
        throw new BadRequestException('Only REQUESTED credits can be approved');
      return row;
    });

    const creditSale = await this.db
      .select()
      .from(creditItemSales)
      .where(eq(creditItemSales.creditId, id));

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
      throw new InternalServerErrorException('Member has approved credit.');

    const [assoc] = await this.db
      .select({
        isPayrollCredit: associates.isPayrollCredit,
        balance: associateHaberesBalance.haberesBalance,
        associateAccountId: associateAccounts.id,
      })
      .from(associates)
      .where(and(
        eq(associates.id, associateId),
        eq(associates.tenantId, tenantId),
      ))
      .leftJoin(
        associateAccounts,
        eq(associateAccounts.associateId, associateId),
      )
      .leftJoin(
        associateHaberesBalance,
        eq(associateHaberesBalance.associateAccountId, associateAccounts.id),
      );
    if (assoc?.isPayrollCredit)
      throw new InternalServerErrorException('Active payroll credit.');
    const avail = this.calculatePercentage(Number(assoc?.balance ?? 0), 80);
    if (Number(avail) < Number(requestedAmount))
      throw new InternalServerErrorException('Insufficient availability.');

    const setting = await this.db
      .select({ value: moduleSettings.value })
      .from(moduleSettings)
      .where(eq(moduleSettings.key, 'MONEDA'))
      .then((r) => r[0]);
    const exchangeRateData = await this.db.query.exchangeRates.findFirst();

    const [creditType] = await this.db
      .select()
      .from(creditsTypes)
      .where(and(
        eq(creditsTypes.id, creditTypeId),
        eq(creditsTypes.tenantId, tenantId),
      ));

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
      await this.generateCodeService.generateNextReference('CRE', tenantId, 'credits', 'management');

    const result = await this.db.transaction(async (tx) => {
      const [updatedCredit] = await tx
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
          updatedById: userId,
        })
        .where(eq(credits.id, id))
        .returning({
          id: credits.id,
          customReference: credits.customReference,
        });

      await tx
        .update(creditItemSales)
        .set({
          deliveryStatus: 'DELIVERED',
        })
        .where(eq(creditItemSales.creditId, id));

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
        schedule.map((s: any) => ({
          ...s,
          dueDate: s.dueDate.toISOString(),
          principalAmount: String(s.principalAmount),
          interestAmount: String(s.interestAmount),
          totalInstallmentAmount: String(s.totalInstallmentAmount),
          principalBalancePending: String(s.principalBalancePending),
        })),
      );

      for (const item of creditSale) {
        if (item.itemType === 'PRODUCT') {
          await this.inventoryMovementsService.create(
            {
              movementType: 'OUT',
              description: `Salida de producto por credito asociado N° ${updatedCredit.customReference}`,
              documentType: 'VENTA',
              documentNumber: updatedCredit.customReference ?? undefined,
              items: [
                {
                  itemId: String(item.itemId ?? 0),
                  itemType: 'PRODUCT',
                  quantity: item.quantity,
                  unitCost: Number(item.agreedSellingPrice),
                },
              ],
            },
            tenantId,
            userId,
          );
        }
      }

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
        }, tenantId);
        if (installmentAmount > 0) {
          await this.associateAccountsMovementsService.create(userId, {
            associateAccountId: assoc.associateAccountId,
            movementType: 'CREDIT_ADMIN_FEE_DEBIT' as AssociateMovementTypeEnum,
            amount: installmentAmount,
            currencyCode: currencyCode as CurrencyCodeEnum,
            transactionDate: new Date(),
            description: `Gastos Administrativos por Crédito N°${customReference}`,
            referenceId: String(id),
            referenceType: 'credits',
          }, tenantId);
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

    let searchConditions: SQL<unknown>[] = [];

    if (tenantId) {
      searchConditions.push(eq(credits.tenantId, tenantId));
    }

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

    const meta = {
      totalItems: totalCount,
      itemCount: data.length,
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
    };

    return {
      data: data.map((credit): any => ({
        ...credit,
        requestedAmount: Number(credit.requestedAmount).toFixed(2),
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
      throw new NotFoundException('Credit not found');
    }

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
      ...data,
      totalCredits: total,
    };
  }

  async findOneRequest(tenantId: string | null, cedula: string) {
    const conditions: SQL<unknown>[] = [eq(associates.cedula, cedula)];
    if (tenantId) {
      conditions.push(eq(associates.tenantId, tenantId));
    }

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
      .where(and(...conditions));

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
        associateAccountId: associateAccount[0]?.associateAccountId,
        accountNumber: associateAccount[0]?.accountNumber,
        balance: Number(associateAccount[0]?.balance ?? 0).toFixed(2),
      },
      totalCredits: total,
      totalLoans: totalLoans,
    };
  }

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
      throw new NotFoundException('Credit not found');
    }

    return credit;
  }

  async remove(tenantId: string | null, userId: string, id: string): Promise<{ message: string }> {
    const conditions: SQL<unknown>[] = [eq(credits.id, id)];
    if (tenantId) {
      conditions.push(eq(credits.tenantId, tenantId));
    }

    const [existingCredit] = await this.db
      .select()
      .from(credits)
      .where(and(...conditions));

    if (!existingCredit) {
      throw new HttpException('Credit not found', HttpStatus.NOT_FOUND);
    }

    await this.db.delete(credits).where(and(...conditions));

    await this.auditHelper.logDelete(userId, 'credit', existingCredit, {
      tenantId: tenantId ?? undefined,
      targetId: id,
      description: `Deleted credit ${id}`,
    });

    return { message: 'Credit deleted successfully' };
  }

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
          eq(credits.creditModality, creditModalityTypeEnum.SPECIAL_QUOTAS),
          or(eq(credits.status, CreditStatusEnum.APPROVED)),
        ),
      );

    const totalCreditPaid = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(credits)
      .where(
        and(...conditions, eq(credits.status, CreditStatusEnum.PAID)),
      );

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

  async findAllByAssociate(tenantId: string | null, associateId: string, filtersDto: PaginationDto) {
    const { page = 1, limit = 10 } = filtersDto;

    const conditions: SQL<unknown>[] = [eq(credits.associateId, associateId)];
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

      const formattedProgress = Math.max(0, Math.min(10, progress)).toFixed(2);

      return {
        ...credit,
        creditAmount: totalAmount.toFixed(2),
        outstandingBalance: outstanding.toFixed(2),
        installmentAmount: parseFloat(credit.installmentAmount || '0').toFixed(2),
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
        id: creditItemSales.id,
        creditId: creditItemSales.creditId,
        itemType: creditItemSales.itemType,
        itemId: creditItemSales.itemId,
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
