import { generateUniqueReference } from '@/common/utils/reference';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import {
  associateAccounts,
  associates,
  auditLogs,
  credits,
  loans,
  systemSettings,
  withdrawalsAssociates,
  withdrawalTypes,
} from '@/database/index';
import { associateHaberesBalance } from '@/database/schema/views';
import {
  AssociateMovementTypeEnum,
  CreditStatusEnum,
  CurrencyCodeEnum,
  LoanStatusEnum,
} from '@/types/enum';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, ilike, or, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssociateAccountsMovementsService } from '../../associate-accounts-movements/associate-accounts-movements.service';
import { CreateWithdrawalAssociateDto } from './dto/create-withdrawal-associate.dto';
import { FilterWithdrawalAssociateDto } from './dto/filter-withdrawal-associate.dto';

@Injectable()
export class WithdrawalAssociateService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
  ) {}

  // --- Helper function to generate custom reference ---
  // private async generateCustomReference(): Promise<string> {
  //   // Fetch the current correlative number and increment it
  //   const key = 'correlativo_retiros';
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
  //     return `RET${result}`; // Prefix the reference
  //   } catch (error) {
  //     console.error('Error generating custom reference:', error);
  //     throw new InternalServerErrorException(
  //       'Failed to generate custom loan reference.',
  //     );
  //   }
  // }

  private _hasElapsedMonths(
    currentDate: Date,
    allowedMonths: number,
    lastOperationDate: Date | null,
  ): boolean {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    if (lastOperationDate === null) {
      return true;
    }
    const lastOperationYear = lastOperationDate.getFullYear();
    const lastOperationMonth = lastOperationDate.getMonth();

    // Calculate the difference in months between the two dates
    const monthDifference =
      (currentYear - lastOperationYear) * 12 +
      (currentMonth - lastOperationMonth);

    // Check if the difference is greater than or equal to the allowed number of months
    return monthDifference >= allowedMonths;
  }

  async create(dto: CreateWithdrawalAssociateDto, userId: number) {
    const {
      associateAccountId,
      paymentMethod,
      requestedAmount,
      withdrawalDate,
      withdrawalTypeId,
    } = dto;

    // Las líneas comentadas para moneda y tasa de cambio no son parte de la lógica central
    // de pago del préstamo, pero las dejo si son necesarias para otras funcionalidades.
    // const setting = await this.db.query.systemSettings.findFirst({
    //   where: eq(systemSettings.key, 'moneda'),
    // });
    // const entryDate = new Date().toISOString().split('T')[0];
    // const exchangeRateData = await this.db.query.exchangeRates.findFirst({
    //   where: eq(exchangeRates.date, entryDate),
    // });

    const setting = await this.db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'tiempo_retiro'),
    });

    const [resultWithdrawal] = await this.db
      .select()
      .from(withdrawalsAssociates)
      .where(eq(withdrawalsAssociates.associateAccountId, associateAccountId))
      .orderBy(desc(withdrawalsAssociates.createdAt));

    //Verificamos si tiene el tiempo permitido para retiro
    const monthsAllowed = this._hasElapsedMonths(
      withdrawalDate,
      Number(setting?.value),
      resultWithdrawal?.createdAt ?? null,
    );

    if (!monthsAllowed) {
      throw new NotFoundException(
        `Associate does not comply with the time allowed to make a withdrawal`,
      );
    }

    const withdrawalType = await this.db.query.withdrawalTypes.findFirst({
      where: eq(withdrawalTypes.id, Number(withdrawalTypeId)),
    });

    const associateAccount = await this.db.query.associateAccounts.findFirst({
      where: eq(associateAccounts.id, Number(associateAccountId)),
    });

    const calculateAssets =
      (Number(associateAccount?.balance) *
        Number(withdrawalType?.withdrawalPercentage)) /
      100;

    if (requestedAmount > calculateAssets) {
      throw new NotFoundException(`amount exceeds 80% of their assets`);
    }

    const calculateAadministrative =
      (Number(requestedAmount) *
        Number(withdrawalType?.administrativeFeePercentage)) /
      100;
    const calculeTotalPay = requestedAmount - calculateAadministrative;

    console.log(calculeTotalPay);

    // Inicia la transacción para asegurar la atomicidad de las operaciones
    await this.db.transaction(async (tx) => {
      // 1. Genera una referencia única para este retiro
      const customReference = generateUniqueReference();

      // 2. Inserta el registro principal del pago en la tabla ''
      const [insertedWithdrawal] = await tx
        .insert(withdrawalsAssociates)
        .values({
          associateAccountId: Number(associateAccountId),
          requestedAmount: requestedAmount,
          administrativeFee: calculateAadministrative,
          disbursedAmount: calculeTotalPay,
          withdrawalDate: withdrawalDate,
          withdrawalTypeId: withdrawalTypeId,
          referenceCode: customReference,
          paymentMethod: paymentMethod,
          createdById: Number(userId),
        })
        .returning({ id: withdrawalsAssociates.id });

      const dataMovements = {
        associateAccountId: Number(associateAccountId),
        movementType: 'SAVING_WITHDRAWAL' as AssociateMovementTypeEnum,
        amount: requestedAmount,
        currencyCode: 'VES' as CurrencyCodeEnum,
        transactionDate: withdrawalDate,
        description: 'RETIRO HABERES',
        referenceId: String(insertedWithdrawal.id),
        referenceType: 'withdrawalsAssociates',
        referenceNumber: customReference,
        area: 'HABERES',
      };

      //registra el movimiento en la cuenta asociado
      await this.associateAccountsMovementsService.create(
        userId,
        dataMovements,
      );

      // Registra el log auditoria
      await tx.insert(auditLogs).values({
        tableName: 'withdrawalsAssociates',
        recordId: String(insertedWithdrawal.id),
        action: 'INSERT',
        userId: Number(userId),
        area: 'HABERES',
        description: 'RETIRO HABERES',
        newData: [dataMovements],
      });
    });

    // Retorna una respuesta de éxito
    return {
      message: 'Withdrawal Associate create success',
    };
  }

  async findAll(paginationDto: FilterWithdrawalAssociateDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      type = '',
    } = paginationDto || {};

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build search condition
    let searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(
        ilike(withdrawalsAssociates.referenceCode, `%${search}%`),
      );
    }

    if (type !== '') {
      searchConditions.push(
        eq(withdrawalsAssociates.withdrawalTypeId, Number(type)),
      );
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${withdrawalsAssociates[sortBy as keyof typeof withdrawalsAssociates]} asc`
        : sql`${withdrawalsAssociates[sortBy as keyof typeof withdrawalsAssociates]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(withdrawalsAssociates)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.db
      .select({
        id: withdrawalsAssociates.id,
        customReference: withdrawalsAssociates.referenceCode,
        withdrawalTypeId: withdrawalsAssociates.withdrawalTypeId,
        withdrawalType: withdrawalTypes.description,
        withdrawalDate: withdrawalsAssociates.withdrawalDate,
        requestedAmount: withdrawalsAssociates.requestedAmount,
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
      })
      .from(withdrawalsAssociates)
      .where(searchCondition)
      .leftJoin(
        associateAccounts,
        eq(associateAccounts.id, withdrawalsAssociates.associateAccountId),
      )
      .leftJoin(associates, eq(associates.id, associateAccounts.associateId))
      .leftJoin(
        withdrawalTypes,
        eq(withdrawalTypes.id, withdrawalsAssociates.withdrawalTypeId),
      )
      .orderBy(orderBy)
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
      data: data,
      meta,
    };
  }

  async findOneRequest(cedula: string) {
    try {
      const result = await this.db
        .select({
          id: associates.id,
          cedula: associates.cedula,
          fullname: associates.fullname,
          phone: associates.phone,
          email: associates.email,
          isPayrollCredit: associates.isPayrollCredit,
          associateAccountId: associateAccounts.id,
          accountNumber: associateAccounts.accountNumber,
          balance: associateHaberesBalance.haberesBalance,
          withdrawalId: withdrawalsAssociates.id,
          withdrawalRequestAmout: withdrawalsAssociates.requestedAmount,
          withdrawalDate: withdrawalsAssociates.withdrawalDate,
        })
        .from(associates)
        .leftJoin(
          associateAccounts,
          eq(associateAccounts.associateId, associates.id),
        )
        .leftJoin(
          withdrawalsAssociates,
          eq(withdrawalsAssociates.associateAccountId, associateAccounts.id),
        )
        .leftJoin(
          associateHaberesBalance,
          eq(associateHaberesBalance.associateAccountId, associateAccounts.id),
        )
        .where(
          and(eq(associates.cedula, cedula), eq(associates.status, 'ACTIVE')),
        )
        .orderBy(desc(withdrawalsAssociates.createdAt))
        .limit(1);

      const totalLoansAssociate = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(loans)
        .where(
          and(
            eq(loans.associateId, result[0].id),
            or(
              eq(loans.status, LoanStatusEnum.APPROVED),
              eq(loans.status, LoanStatusEnum.DISBURSED),
            ),
          ),
        );

      const totalCreditsAssociate = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(credits)
        .where(
          and(
            eq(credits.associateId, result[0].id),
            eq(credits.status, CreditStatusEnum.APPROVED),
          ),
        );

      return {
        id: result[0].id,
        cedula: result[0].cedula,
        fullname: result[0].fullname,
        phone: result[0].phone,
        email: result[0].email,
        isPayrollCredit: result[0].isPayrollCredit,
        associateAccountId: result[0].associateAccountId,
        accountNumber: result[0].accountNumber,
        balance: result[0].balance,
        withdrawalId: result[0].withdrawalId,
        withdrawalRequestAmout: result[0].withdrawalRequestAmout,
        withdrawalDate: result[0].withdrawalDate,
        totalLoansAssociate: Number(totalLoansAssociate[0].count),
        totalCreditsAssociate: Number(totalCreditsAssociate[0].count),
      };
    } catch (error) {
      console.log(error);

      return new InternalServerErrorException(
        'Error fetching withdrawal request details.',
      );
    }
  }

  // async remove(id: number): Promise<{ message: string }> {
  //   const [existingLoan] = await this.db
  //     .select()
  //     .from(loans)
  //     .where(eq(loans.id, id));

  //   if (!existingLoan) {
  //     throw new HttpException('Loan not found', HttpStatus.NOT_FOUND);
  //   }

  //   await this.db.delete(loans).where(eq(loans.id, id));
  //   return { message: 'Loan deleted successfully' };
  // }

  // async findCountAllLoans() {
  //   const totalLoansOrdinary = await this.db
  //     .select({ count: sql<number>`count(*)` })
  //     .from(loans)
  //     .where(
  //       and(
  //         eq(loans.loanModality, loanModalityTypeEnum.ORDINARY),
  //         or(
  //           eq(loans.status, LoanStatusEnum.APPROVED),
  //           eq(loans.status, LoanStatusEnum.DISBURSED),
  //         ),
  //       ),
  //     );

  //   const totalLoanSpecialQuotas = await this.db
  //     .select({ count: sql<number>`count(*)` })
  //     .from(loans)
  //     .where(
  //       and(
  //         eq(loans.loanModality, loanModalityTypeEnum.SPECIAL_QUOTAS),
  //         or(
  //           eq(loans.status, LoanStatusEnum.APPROVED),
  //           eq(loans.status, LoanStatusEnum.DISBURSED),
  //         ),
  //       ),
  //     );

  //   const totalLoanPaid = await this.db
  //     .select({ count: sql<number>`count(*)` })
  //     .from(loans)
  //     .where(eq(loans.status, LoanStatusEnum.PAID));

  //   const totalLoanInPaymet = await this.db
  //     .select({ count: sql<number>`count(*)` })
  //     .from(loans)
  //     .where(eq(loans.status, LoanStatusEnum.IN_PAYMENT));

  //   return {
  //     totalLoansOrdinary: Number(totalLoansOrdinary[0].count),
  //     totalLoanSpecialQuotas: Number(totalLoanSpecialQuotas[0].count),
  //     totalLoanPaid: Number(totalLoanPaid[0].count),
  //     totalLoanInPaymet: Number(totalLoanInPaymet[0].count),
  //   };
  // }
}
