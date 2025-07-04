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
  BadRequestException,
  Inject,
  Injectable,
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
      .orderBy(desc(withdrawalsAssociates.createdAt))
      .limit(1);
    console.log(resultWithdrawal);

    if (
      resultWithdrawal.status === 'DISBURSED' ||
      resultWithdrawal.status === 'ADJUSTED'
    ) {
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
    }

    if (
      resultWithdrawal.status === 'APPROVED' ||
      resultWithdrawal.status === 'REQUESTED'
    ) {
      throw new NotFoundException(
        `A withdrawal cannot be made. You must disburse the last approved withdrawal.`,
      );
    }

    const withdrawalType = await this.db.query.withdrawalTypes.findFirst({
      where: eq(withdrawalTypes.id, Number(withdrawalTypeId)),
    });

    const [associateAccount] = await this.db
      .select()
      .from(associateHaberesBalance)
      .where(
        eq(
          associateHaberesBalance.associateAccountId,
          Number(associateAccountId),
        ),
      );

    const calculateAssets =
      (Number(associateAccount?.haberesBalance) *
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
          status: 'APPROVED',
        })
        .returning();

      // const dataMovements = {
      //   associateAccountId: Number(associateAccountId),
      //   movementType: 'SAVING_WITHDRAWAL' as AssociateMovementTypeEnum,
      //   amount: requestedAmount,
      //   currencyCode: 'VES' as CurrencyCodeEnum,
      //   transactionDate: withdrawalDate,
      //   description: 'RETIRO HABERES',
      //   referenceId: String(insertedWithdrawal.id),
      //   referenceType: 'withdrawalsAssociates',
      //   referenceNumber: customReference,
      //   area: 'HABERES',
      // };

      // const dataMovementsAdministrativeFee = {
      //   associateAccountId: Number(associateAccountId),
      //   movementType: 'WITHDRAWAL_FEE_DEBIT' as AssociateMovementTypeEnum,
      //   amount: calculateAadministrative,
      //   currencyCode: 'VES' as CurrencyCodeEnum,
      //   transactionDate: withdrawalDate,
      //   description: 'DEBITO GASTOS ADMINISTRATIVOS POR RETIRO HABERES',
      //   referenceId: String(insertedWithdrawal.id),
      //   referenceType: 'withdrawalsAssociates',
      //   referenceNumber: customReference,
      //   area: 'HABERES',
      // };

      // //registra el movimiento en la cuenta asociado
      // await this.associateAccountsMovementsService.create(
      //   userId,
      //   dataMovements,
      // );

      // await this.associateAccountsMovementsService.create(
      //   userId,
      //   dataMovementsAdministrativeFee,
      // );

      // Registra el log auditoria
      await tx.insert(auditLogs).values({
        tableName: 'withdrawalsAssociates',
        recordId: String(insertedWithdrawal.id),
        action: 'INSERT',
        userId: Number(userId),
        area: 'HABERES',
        description: 'RETIRO HABERES APROBADO',
        newData: [insertedWithdrawal],
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
        status: withdrawalsAssociates.status,
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

    const transformedData = data.map((item) => ({
      ...item,
      requestedAmount: Number(item.requestedAmount).toFixed(2),
    }));

    return {
      data: transformedData,
      meta,
    };
  }

  async findOneRequest(cedula: string) {
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
        withdrawalStatus: withdrawalsAssociates.status,
        status: associates.status,
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
      .where(eq(associates.cedula, cedula))
      .orderBy(desc(withdrawalsAssociates.createdAt))
      .limit(1);

    if (!result.length) {
      throw new NotFoundException(`Associate with cedula ${cedula} not found`);
    }

    if (result[0].status === 'INACTIVE') {
      throw new NotFoundException(
        `Associate with cedula ${cedula} is inactive`,
      );
    }

    if (result[0].status === 'RETIRED') {
      throw new NotFoundException(`Associate with cedula ${cedula} is retired`);
    }

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
      balance: Number(result[0].balance).toFixed(2),
      withdrawalId: result[0].withdrawalId,
      withdrawalRequestAmout: result[0].withdrawalRequestAmout,
      withdrawalDate: result[0].withdrawalDate,
      withdrawalStatus: result[0].withdrawalStatus,
      totalLoansAssociate: Number(totalLoansAssociate[0].count),
      totalCreditsAssociate: Number(totalCreditsAssociate[0].count),
    };
  }

  async remove(withdrawalId: number, userId: number) {
    return await this.db.transaction(async (tx) => {
      // 1. Validar que el retiro existe
      const withdrawal = await tx.query.withdrawalsAssociates.findFirst({
        where: eq(withdrawalsAssociates.id, withdrawalId),
      });

      if (!withdrawal) {
        throw new NotFoundException(`The retreat was not found.`);
      }

      const { status, associateAccountId, disbursedAmount, referenceCode } =
        withdrawal;

      // 2. Validar y actuar según el estado
      if (status === 'REQUESTED' || status === 'APPROVED') {
        // Caso A: Cancelar un retiro solicitado o aprobado
        await tx
          .update(withdrawalsAssociates)
          .set({ status: 'CANCELLED', updatedById: userId })
          .where(eq(withdrawalsAssociates.id, withdrawalId));

        await tx.insert(auditLogs).values({
          tableName: 'withdrawalsAssociates',
          recordId: String(withdrawalId),
          action: 'CANCELED',
          userId: userId,
          area: 'HABERES',
          description: `Cancelación de retiro ${referenceCode}`,
          newData: [{ status: 'CANCELED' }],
        });

        return { message: `The retreat has been cancelled.` };
      } else if (status === 'DISBURSED') {
        // Caso B: Reversar un retiro ya desembolsado
        await tx
          .update(withdrawalsAssociates)
          .set({ status: 'REVERSED', updatedById: userId })
          .where(eq(withdrawalsAssociates.id, withdrawalId));

        // Crear el movimiento de reverso en la cuenta
        await this.associateAccountsMovementsService.create(userId, {
          associateAccountId: associateAccountId,
          movementType:
            'SAVING_WITHDRAWAL_REVERSAL_CREDIT' as AssociateMovementTypeEnum,
          amount: Number(disbursedAmount),
          currencyCode: 'VES' as CurrencyCodeEnum,
          description: `REVERSO RETIRO HABERES - REF: ${referenceCode}`,
          referenceId: String(withdrawalId),
          referenceType: 'withdrawalsAssociates',
          area: 'HABERES',
        });

        await tx.insert(auditLogs).values({
          tableName: 'withdrawalsAssociates',
          recordId: String(withdrawalId),
          action: 'REVERSED',
          userId: userId,
          area: 'HABERES',
          description: `Reverso de retiro ${referenceCode}`,
          newData: [{ status: 'REVERSED' }],
        });

        return { message: `El retiro ${referenceCode} ha sido reversado.` };
      } else {
        // Caso C: Estado no válido para la operación
        throw new BadRequestException(
          `A withdrawal with that status cannot be cancelled or reversed.`,
        );
      }
    });
  }
}
