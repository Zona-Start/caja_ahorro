import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
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
import { InventoryMovementsService } from '@/features/administration/inventory/inventory-movements/inventory-movements.service';
import {
  AssociateMovementTypeEnum,
  CreditStatusEnum,
  CurrencyCodeEnum,
  LoanStatusEnum,
  withdrawalStatusEnum,
} from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, ilike, inArray, or, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssociateAccountsMovementsService } from '../../associate-accounts-movements/associate-accounts-movements.service';
import { CreateWithdrawalAssociateDto } from './dto/create-withdrawal-associate.dto';
import { FilterWithdrawalAssociateDto } from './dto/filter-withdrawal-associate.dto';

@Injectable()
export class WithdrawalAssociateService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly generateCodeService: GenerateCodeService,
    private readonly inventoryMovementsService: InventoryMovementsService,
  ) {}

  private _hasElapsedMonths(
    currentDate: Date,
    allowedMonths: number,
    lastOperationDate: Date | null,
  ): boolean {
    if (lastOperationDate === null) {
      return true;
    }
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const lastOperationYear = lastOperationDate.getFullYear();
    const lastOperationMonth = lastOperationDate.getMonth();
    const monthDifference =
      (currentYear - lastOperationYear) * 12 +
      (currentMonth - lastOperationMonth);
    return monthDifference >= allowedMonths;
  }

  async execute(dto: CreateWithdrawalAssociateDto, userId: number) {
    const {
      associateAccountId,
      paymentMethod,
      requestedAmount,
      withdrawalDate,
      withdrawalTypeId,
      commercialHouseId,
      withdrawalItems,
    } = dto;

    const setting = await this.db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'TIEMPO_RETIRO'),
    });

    const [lastWithdrawal] = await this.db
      .select()
      .from(withdrawalsAssociates)
      .where(eq(withdrawalsAssociates.associateAccountId, associateAccountId))
      .orderBy(desc(withdrawalsAssociates.createdAt))
      .limit(1);

    if (lastWithdrawal) {
      if (
        lastWithdrawal.status === withdrawalStatusEnum.DISBURSED ||
        lastWithdrawal.status === withdrawalStatusEnum.ADJUSTED
      ) {
        const monthsAllowed = this._hasElapsedMonths(
          withdrawalDate,
          Number(setting?.value),
          lastWithdrawal?.createdAt ?? null,
        );
        if (!monthsAllowed) {
          throw new BadRequestException(
            `No ha transcurrido el tiempo permitido para un nuevo retiro.`,
          );
        }
      }

      if (
        lastWithdrawal.status === withdrawalStatusEnum.APPROVED ||
        lastWithdrawal.status === withdrawalStatusEnum.REQUESTED
      ) {
        throw new BadRequestException(
          `No se puede procesar el retiro. Debe desembolsarse o anularse el último retiro.`,
        );
      }
    }

    const withdrawalType = await this.db.query.withdrawalTypes.findFirst({
      where: eq(withdrawalTypes.id, Number(withdrawalTypeId)),
    });

    if (!withdrawalType) {
      throw new NotFoundException('Tipo de retiro no encontrado.');
    }

    const [associateAccount] = await this.db
      .select()
      .from(associateHaberesBalance)
      .where(
        eq(
          associateHaberesBalance.associateAccountId,
          Number(associateAccountId),
        ),
      );

    const maxAllowedAmount =
      (Number(associateAccount?.haberesBalance) *
        Number(withdrawalType?.withdrawalPercentage)) /
      100;

    if (requestedAmount > maxAllowedAmount) {
      throw new BadRequestException(
        `El monto solicitado excede el porcentaje máximo permitido de sus haberes.`,
      );
    }

    return this.db.transaction(async (tx) => {
      const [insertedWithdrawal] = await tx
        .insert(withdrawalsAssociates)
        .values({
          associateAccountId: Number(associateAccountId),
          requestedAmount: requestedAmount.toString(),
          withdrawalDate: withdrawalDate,
          withdrawalTypeId: withdrawalTypeId,
          referenceCode:
            await this.generateCodeService.generateNextReference('RH-RET'),
          paymentMethod: paymentMethod,
          createdById: Number(userId),
          status: withdrawalStatusEnum.REQUESTED, // <-- Nuevo estado inicial
          commercialHouseId: commercialHouseId,
          withdrawalItems: withdrawalItems,
        })
        .returning();

      await tx.insert(auditLogs).values({
        tableName: 'withdrawalsAssociates',
        recordId: String(insertedWithdrawal.id),
        action: 'INSERT',
        userId: Number(userId),
        area: 'HABERES',
        description: `SOLICTUD DE RETIRO DE HABERES POR EL VALOR DE ${requestedAmount}`,
        newData: [insertedWithdrawal],
      });

      return { message: 'Solicitud de retiro creada exitosamente' };
    });
  }

  async approve(id: number, userId: number) {
    return this.db.transaction(async (tx) => {
      const [withdrawal] = await tx
        .select()
        .from(withdrawalsAssociates)
        .where(eq(withdrawalsAssociates.id, id));

      if (!withdrawal) {
        throw new NotFoundException('Retiro no encontrado.');
      }

      if (withdrawal.status !== withdrawalStatusEnum.REQUESTED) {
        throw new BadRequestException(
          `Solo se pueden aprobar retiros en estado 'Solicitado'.`,
        );
      }

      const withdrawalType = await tx.query.withdrawalTypes.findFirst({
        where: eq(withdrawalTypes.id, Number(withdrawal.withdrawalTypeId)),
      });

      if (!withdrawalType) {
        throw new NotFoundException('Tipo de retiro no encontrado.');
      }

      const isGoodsWithdrawal =
        withdrawal.commercialHouseId != null ||
        (Array.isArray(withdrawal.withdrawalItems) &&
          withdrawal.withdrawalItems.length > 0);

      if (isGoodsWithdrawal) {
        // Es un retiro de bienes, se descuenta de haberes y se marca como desembolsado.
        const administrativeFee =
          (Number(withdrawal.requestedAmount) *
            Number(withdrawalType.administrativeFeePercentage)) /
          100;

        await this.associateAccountsMovementsService.create(userId, {
          associateAccountId: withdrawal.associateAccountId,
          movementType: AssociateMovementTypeEnum.SAVING_WITHDRAWAL,
          amount: Number(withdrawal.requestedAmount),
          currencyCode: CurrencyCodeEnum.VES,
          transactionDate: new Date(),
          description: `Retiro de Haberes por Bienes Ref: ${withdrawal.referenceCode}`,
          referenceId: String(withdrawal.id),
          referenceType: 'withdrawalsAssociates',
          referenceNumber: withdrawal.referenceCode ?? undefined,
          area: 'HABERES',
        });

        if (administrativeFee > 0) {
          await this.associateAccountsMovementsService.create(userId, {
            associateAccountId: withdrawal.associateAccountId,
            movementType: AssociateMovementTypeEnum.WITHDRAWAL_FEE_DEBIT,
            amount: administrativeFee,
            currencyCode: CurrencyCodeEnum.VES,
            transactionDate: new Date(),
            description: `Gasto Administrativo por retiro de bienes Ref: ${withdrawal.referenceCode}`,
            referenceId: String(withdrawal.id),
            referenceType: 'withdrawalsAssociates',
            referenceNumber: withdrawal.referenceCode ?? undefined,
            area: 'HABERES',
          });
        }

        const disbursedAmount =
          Number(withdrawal.requestedAmount) - administrativeFee;
        const [updated] = await tx
          .update(withdrawalsAssociates)
          .set({
            status: withdrawalStatusEnum.DISBURSED,
            administrativeFee: administrativeFee.toString(),
            disbursedAmount: disbursedAmount.toString(),
            updatedById: userId,
          })
          .where(eq(withdrawalsAssociates.id, id))
          .returning();

        await tx.insert(auditLogs).values({
          tableName: 'withdrawalsAssociates',
          recordId: String(id),
          action: 'UPDATE',
          userId: userId,
          area: 'HABERES',
          description: `Retiro de haberes por bienes desembolsados.`,
          newData: [updated],
          previousData: [withdrawal],
        });

        if (Array.isArray(withdrawal.withdrawalItems)) {
          for (const item of withdrawal.withdrawalItems) {
            if (item.itemType === 'PRODUCT') {
              await this.inventoryMovementsService.create(
                userId,
                {
                  movementType: 'OUT',
                  description: `Salida Producto por retiro de haberes Ref: ${withdrawal.referenceCode}`,
                  documentType: 'VENTA',
                  documentNumber: withdrawal.referenceCode ?? undefined,
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
        }

        return { message: 'Retiro por bienes desembolsado exitosamente.' };
      } else {
        // Es un retiro monetario, solo se aprueba y queda pendiente de desembolso.
        const [updated] = await tx
          .update(withdrawalsAssociates)
          .set({ status: withdrawalStatusEnum.APPROVED, updatedById: userId })
          .where(eq(withdrawalsAssociates.id, id))
          .returning();

        await tx.insert(auditLogs).values({
          tableName: 'withdrawalsAssociates',
          recordId: String(id),
          action: 'UPDATE',
          userId: userId,
          area: 'HABERES',
          description: `Retiro monetario aprobado.`,
          newData: [updated],
          previousData: [withdrawal],
        });

        return { message: 'Retiro monetario aprobado exitosamente.' };
      }
    });
  }

  async findAll(paginationDto: FilterWithdrawalAssociateDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      type = '',
      status = '',
    } = paginationDto || {};

    const offset = (page - 1) * limit;

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

    if (status !== '') {
      searchConditions.push(
        eq(withdrawalsAssociates.status, status as withdrawalStatusEnum),
      );
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${withdrawalsAssociates[sortBy as keyof typeof withdrawalsAssociates]} asc`
        : sql`${withdrawalsAssociates[sortBy as keyof typeof withdrawalsAssociates]} desc`;

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(withdrawalsAssociates)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

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

  async findAllByAssociate(associateId: number) {
    // First, find the associate's account(s)
    const accounts = await this.db.query.associateAccounts.findMany({
      where: eq(schema.associateAccounts.associateId, associateId),
      columns: {
        id: true,
      },
    });

    if (!accounts.length) {
      return {
        message: `No accounts found for associate with ID ${associateId}`,
        data: [],
      };
    }

    const accountIds = accounts.map((acc) => acc.id);

    const withdrawals = await this.db
      .select({
        id: withdrawalsAssociates.id,
        withdrawalDate: withdrawalsAssociates.withdrawalDate,
        description: withdrawalTypes.description,
        amount: withdrawalsAssociates.requestedAmount,
        disbursedAmount: withdrawalsAssociates.disbursedAmount,
        administrativeFee: withdrawalsAssociates.administrativeFee,
        paymentMethod: withdrawalsAssociates.paymentMethod,
        status: withdrawalsAssociates.status,
      })
      .from(withdrawalsAssociates)
      .leftJoin(
        withdrawalTypes,
        eq(withdrawalsAssociates.withdrawalTypeId, withdrawalTypes.id),
      )
      .where(inArray(withdrawalsAssociates.associateAccountId, accountIds))
      .orderBy(desc(withdrawalsAssociates.withdrawalDate));

    if (!withdrawals.length) {
      return {
        message: 'No withdrawals found for this associate.',
        data: [],
      };
    }

    const formattedWithdrawals = withdrawals.map((w) => ({
      ...w,
      amount: parseFloat(w.amount).toFixed(2),
      disbursedAmount: parseFloat(w.disbursedAmount ?? '0').toFixed(2),
      administrativeFee: parseFloat(w.administrativeFee ?? '0').toFixed(2),
    }));

    console.log(formattedWithdrawals);

    return {
      message: 'Withdrawals fetched successfully.',
      data: formattedWithdrawals,
    };
  }

  async remove(withdrawalId: number, userId: number) {
    return await this.db.transaction(async (tx) => {
      const withdrawal = await tx.query.withdrawalsAssociates.findFirst({
        where: eq(withdrawalsAssociates.id, withdrawalId),
      });

      if (!withdrawal) {
        throw new NotFoundException(`The retreat was not found.`);
      }

      const { status, associateAccountId, disbursedAmount, referenceCode } =
        withdrawal;

      if (status === 'REQUESTED' || status === 'APPROVED') {
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
        await tx
          .update(withdrawalsAssociates)
          .set({ status: 'REVERSED', updatedById: userId })
          .where(eq(withdrawalsAssociates.id, withdrawalId));

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
        throw new BadRequestException(
          `A withdrawal with that status cannot be cancelled or reversed.`,
        );
      }
    });
  }

  async findWithdrawalAprovee() {
    const result = await this.db
      .select({
        id: withdrawalsAssociates.id,
        associateId: associates.id,
        associateCedula: associates.cedula,
        associateName: associates.fullname,
        reference: withdrawalsAssociates.referenceCode,
        approvalDate: withdrawalsAssociates.updatedAt,
        amount: withdrawalsAssociates.requestedAmount,
      })
      .from(withdrawalsAssociates)
      .leftJoin(
        associateAccounts,
        eq(associateAccounts.id, withdrawalsAssociates.associateAccountId),
      )
      .leftJoin(associates, eq(associates.id, associateAccounts.associateId))
      .where(eq(withdrawalsAssociates.status, 'APPROVED'));

    return {
      data: result,
    };
  }

  async findWithdrawalDetails(id: number) {
    type WithdrawalItem = {
      days: number | null;
      itemId: number;
      itemType: 'PRODUCT' | 'SERVICE' | 'OTHER';
      quantity: number;
      itemDescription: string | null;
      agreedSellingPrice: number;
      itemName: string | null;
    };
    const [withdrawal] = await this.db
      .select({
        id: withdrawalsAssociates.id,
        associateAccountId: withdrawalsAssociates.associateAccountId,
        withdrawalTypeId: withdrawalsAssociates.withdrawalTypeId,
        withdrawalDate: withdrawalsAssociates.withdrawalDate,
        requestedAmount: withdrawalsAssociates.requestedAmount,
        administrativeFee: withdrawalsAssociates.administrativeFee,
        disbursedAmount: withdrawalsAssociates.disbursedAmount,
        paymentMethod: withdrawalsAssociates.paymentMethod,
        referenceCode: withdrawalsAssociates.referenceCode,
        status: withdrawalsAssociates.status,
        commercialHouseId: withdrawalsAssociates.commercialHouseId,
        withdrawalItems: withdrawalsAssociates.withdrawalItems,
        associateName: schema.associates.fullname,
        associateCedula: schema.associates.cedula,
        withdrawalTypeName: schema.withdrawalTypes.description,
      })
      .from(withdrawalsAssociates)
      .where(eq(withdrawalsAssociates.id, id))
      .leftJoin(
        schema.associateAccounts,
        eq(
          withdrawalsAssociates.associateAccountId,
          schema.associateAccounts.id,
        ),
      )
      .leftJoin(
        schema.associates,
        eq(schema.associateAccounts.associateId, schema.associates.id),
      )
      .leftJoin(
        schema.withdrawalTypes,
        eq(withdrawalsAssociates.withdrawalTypeId, schema.withdrawalTypes.id),
      );

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    let items: WithdrawalItem[] = [];
    if (
      withdrawal.withdrawalItems &&
      Array.isArray(withdrawal.withdrawalItems)
    ) {
      for (const item of withdrawal.withdrawalItems as WithdrawalItem[]) {
        if (item.itemType === 'PRODUCT') {
          const [product] = await this.db
            .select()
            .from(schema.products)
            .where(eq(schema.products.id, item.itemId));
          items.push({ ...item, itemName: product?.name });
        } else if (item.itemType === 'SERVICE') {
          const [service] = await this.db
            .select()
            .from(schema.services)
            .where(eq(schema.services.id, item.itemId));
          items.push({ ...item, itemName: service?.name });
        } else {
          items.push({ ...item, itemName: item.itemDescription });
        }
      }
    }

    return {
      withdrawal,
      items,
    };
  }
}
