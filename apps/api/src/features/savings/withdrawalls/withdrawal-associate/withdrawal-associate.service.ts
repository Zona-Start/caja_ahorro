import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  associateAccounts,
  associates,
  credits,
  loans,
  withdrawalsAssociates,
  withdrawalTypes,
} from '@/database/schema';
import { associateHaberesBalance } from '@/database/schema/views';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import { InventoryMovementsService } from '@/features/inventory/inventory-movements/inventory-movements.service';
import {
  AssociateMovementTypeEnum,
  BankTransactionCategory,
  CreditStatusEnum,
  CurrencyCodeEnum,
  LoanStatusEnum,
  movementStatusEnum,
  paymentMethodEnum,
  withdrawalStatusEnum,
} from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, desc, eq, ilike, inArray, or, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssociateAccountsMovementsService } from '../../parnerts/associate-accounts-movements/associate-accounts-movements.service';
import { WithdrawalAssociateAccountingService } from './withdrawal-associate-accounting.service';
import {
  CreateWithdrawalAssociateDto,
  DisburseWithdrawalAssociateDto,
  FilterWithdrawalAssociateDto,
} from './dto/withdrawal.schema';

@Injectable()
export class WithdrawalAssociateService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly generateCodeService: GenerateCodeService,
    private readonly inventoryMovementsService: InventoryMovementsService,
    private readonly withdrawalAccountingService: WithdrawalAssociateAccountingService,
    private readonly bankMovementsService: BankMovementsService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

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

  async execute(
    tenantId: string,
    userId: string,
    dto: CreateWithdrawalAssociateDto,
  ) {
    const {
      associateAccountId,
      withdrawalTypeId,
      requestedAmount,
      paymentMethod,
      date,
      description,
      commercialHouseId,
      withdrawalItems,
    } = dto;

    const setting = await this.db.query.moduleSettings.findFirst({
      where: and(
        eq(schema.moduleSettings.tenantId, tenantId),
        eq(schema.moduleSettings.module, 'savings'),
        eq(schema.moduleSettings.submodule, 'withdrawals'),
        eq(schema.moduleSettings.key, 'WITHDRAWAL_TIME_MONTHS'),
      ),
    });

    const [lastWithdrawal] = await this.db
      .select()
      .from(withdrawalsAssociates)
      .where(
        and(
          eq(withdrawalsAssociates.associateAccountId, associateAccountId),
          eq(withdrawalsAssociates.tenantId, tenantId),
        ),
      )
      .orderBy(desc(withdrawalsAssociates.createdAt))
      .limit(1);

    if (lastWithdrawal) {
      if (
        lastWithdrawal.status === withdrawalStatusEnum.DISBURSED ||
        lastWithdrawal.status === withdrawalStatusEnum.ADJUSTED
      ) {
        const monthsAllowed = this._hasElapsedMonths(
          new Date(date),
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
      where: and(
        eq(withdrawalTypes.id, withdrawalTypeId),
        eq(withdrawalTypes.tenantId, tenantId),
      ),
    });

    if (!withdrawalType) {
      throw new NotFoundException('Tipo de retiro no encontrado.');
    }

    const [associateAccount] = await this.db
      .select()
      .from(associateHaberesBalance)
      .where(
        eq(associateHaberesBalance.associateAccountId, associateAccountId),
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

    const haberesBalance = Number(associateAccount?.haberesBalance ?? 0);
    const available80 = haberesBalance * 0.8;

    if (requestedAmount > available80) {
      throw new BadRequestException(
        `El monto solicitado (${requestedAmount.toFixed(2)}) supera el 80% disponible (${available80.toFixed(2)}) de sus haberes.`,
      );
    }

    const [account] = await this.db
      .select({ associateId: associateAccounts.associateId })
      .from(associateAccounts)
      .where(eq(associateAccounts.id, associateAccountId));

    if (!account || !account.associateId) {
      throw new NotFoundException('Cuenta de asociado no encontrada.');
    }

    const associate = await this.db.query.associates.findFirst({
      where: and(
        eq(associates.id, account.associateId!),
        eq(associates.tenantId, tenantId),
      ),
    });

    if (!associate) {
      throw new NotFoundException('Asociado no encontrado.');
    }

    if (associate.isPayrollCredit) {
      throw new BadRequestException(
        'El asociado posee credinomina activo. No puede solicitar retiros.',
      );
    }

    const [activeLoans] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .where(
        and(
          eq(loans.associateId, account.associateId),
          eq(loans.tenantId, tenantId),
          or(
            eq(loans.status, LoanStatusEnum.APPROVED),
            eq(loans.status, LoanStatusEnum.DISBURSED),
            eq(loans.status, LoanStatusEnum.IN_PAYMENT),
          ),
        ),
      );

    if (Number(activeLoans.count) > 0) {
      throw new BadRequestException(
        'El asociado tiene un préstamo activo. No puede solicitar retiros.',
      );
    }

    const [activeCredits] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(credits)
      .where(
        and(
          eq(credits.associateId, account.associateId),
          eq(credits.tenantId, tenantId),
          or(
            eq(credits.status, CreditStatusEnum.APPROVED),
            eq(credits.status, CreditStatusEnum.IN_PAYMENT),
          ),
        ),
      );

    if (Number(activeCredits.count) > 0) {
      throw new BadRequestException(
        'El asociado tiene un crédito activo. No puede solicitar retiros.',
      );
    }

    return this.db.transaction(async (tx) => {
      const [insertedWithdrawal] = await tx
        .insert(withdrawalsAssociates)
        .values({
          tenantId,
          associateAccountId,
          requestedAmount: requestedAmount.toString(),
          withdrawalDate: date,
          withdrawalTypeId,
          referenceCode: await this.generateCodeService.generateNextReference(
            'RH-RET',
            tenantId,
            'savings',
            'withdrawals',
          ),
          paymentMethod,
          createdById: userId,
          status: withdrawalStatusEnum.REQUESTED,
          commercialHouseId: commercialHouseId ?? null,
          withdrawalItems: withdrawalItems ?? null,
        })
        .returning();

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'withdrawalsAssociates',
          recordId: insertedWithdrawal.id,
          action: 'INSERT',
          userId,
          area: 'savings_banks',
          description: `Solicitud de retiro de haberes por el valor de ${requestedAmount}`,
          newData: [insertedWithdrawal],
          tenantId,
        }),
      );

      return { message: 'Solicitud de retiro creada exitosamente' };
    });
  }

  async approve(tenantId: string, userId: string, id: string) {
    return this.db.transaction(async (tx) => {
      const [withdrawal] = await tx
        .select()
        .from(withdrawalsAssociates)
        .where(
          and(
            eq(withdrawalsAssociates.id, id),
            eq(withdrawalsAssociates.tenantId, tenantId),
          ),
        );

      if (!withdrawal) {
        throw new NotFoundException('Retiro no encontrado.');
      }

      if (withdrawal.status !== withdrawalStatusEnum.REQUESTED) {
        throw new BadRequestException(
          `Solo se pueden aprobar retiros en estado 'Solicitado'.`,
        );
      }

      const withdrawalType = await tx.query.withdrawalTypes.findFirst({
        where: and(
          eq(withdrawalTypes.id, String(withdrawal.withdrawalTypeId)),
          eq(withdrawalTypes.tenantId, tenantId),
        ),
      });

      if (!withdrawalType) {
        throw new NotFoundException('Tipo de retiro no encontrado.');
      }

      const feePercentage = Number(
        withdrawalType?.administrativeFeePercentage ?? 0,
      );
      const administrativeFee =
        (Number(withdrawal.requestedAmount) * feePercentage) / 100;
      const disbursedAmount =
        Number(withdrawal.requestedAmount) - administrativeFee;

      const isGoodsWithdrawal =
        withdrawal.commercialHouseId != null ||
        (Array.isArray(withdrawal.withdrawalItems) &&
          withdrawal.withdrawalItems.length > 0);

      const [updated] = await tx
        .update(withdrawalsAssociates)
        .set({
          status: withdrawalStatusEnum.APPROVED,
          updatedById: userId,
          administrativeFee: administrativeFee.toString(),
          disbursedAmount: disbursedAmount.toString(),
        })
        .where(
          and(
            eq(withdrawalsAssociates.id, id),
            eq(withdrawalsAssociates.tenantId, tenantId),
          ),
        )
        .returning();

      await this.associateAccountsMovementsService.create(
        userId,
        {
          associateAccountId: withdrawal.associateAccountId,
          movementType: AssociateMovementTypeEnum.SAVING_WITHDRAWAL,
          amount: Number(withdrawal.requestedAmount),
          currencyCode: CurrencyCodeEnum.VES,
          transactionDate: new Date(),
          description: `Retiro ${isGoodsWithdrawal ? withdrawalType?.description : 'de Haberes'} - Ref: ${withdrawal.referenceCode}`,
          referenceId: withdrawal.id,
          referenceType: 'withdrawalsAssociates',
          status: 'PENDING' as movementStatusEnum,
        },
        tenantId,
      );

      if (administrativeFee > 0) {
        await this.associateAccountsMovementsService.create(
          userId,
          {
            associateAccountId: withdrawal.associateAccountId,
            movementType: AssociateMovementTypeEnum.WITHDRAWAL_FEE_DEBIT,
            amount: administrativeFee,
            currencyCode: CurrencyCodeEnum.VES,
            transactionDate: new Date(),
            description: `Gasto Administrativo por ${isGoodsWithdrawal ? withdrawalType?.description : 'retiro de Haberes'} - Ref: ${withdrawal.referenceCode}`,
            referenceId: withdrawal.id,
            referenceType: 'withdrawalsAssociates',
            status: 'PENDING' as movementStatusEnum,
          },
          tenantId,
        );
      }

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'withdrawalsAssociates',
          recordId: id,
          action: 'UPDATE',
          userId,
          area: 'savings_banks',
          description: `Retiro ${isGoodsWithdrawal ? withdrawalType?.description : 'de Haberes'} aprobado y movimiento generado en pendiente.`,
          newData: [updated],
          previousData: [withdrawal],
          tenantId,
        }),
      );

      return { message: 'Retiro aprobado exitosamente.' };
    });
  }

  async findAll(tenantId: string, paginationDto: FilterWithdrawalAssociateDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'desc',
      type = '',
      status = '',
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [
      eq(withdrawalsAssociates.tenantId, tenantId),
    ];

    if (search) {
      searchConditions.push(
        ilike(withdrawalsAssociates.referenceCode, `%${search}%`),
      );
    }

    if (type !== '') {
      searchConditions.push(eq(withdrawalsAssociates.withdrawalTypeId, type));
    }

    if (status !== '') {
      searchConditions.push(
        eq(withdrawalsAssociates.status, status as withdrawalStatusEnum),
      );
    }

    const searchCondition = and(...searchConditions);

    const orderBy =
      sortOrder === 'asc'
        ? sql`${withdrawalsAssociates[sortBy as keyof typeof withdrawalsAssociates]} asc`
        : sql`${withdrawalsAssociates[sortBy as keyof typeof withdrawalsAssociates]} desc`;

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(withdrawalsAssociates)
      .where(searchCondition);

    const totalItems = Number(totalCountResult[0].count);

    const data = await this.db
      .select({
        id: withdrawalsAssociates.id,
        customReference: withdrawalsAssociates.referenceCode,
        withdrawalTypeId: withdrawalsAssociates.withdrawalTypeId,
        withdrawalType: withdrawalTypes.description,
        withdrawalDate: withdrawalsAssociates.withdrawalDate,
        requestedAmount: withdrawalsAssociates.requestedAmount,
        disbursedAmount: withdrawalsAssociates.disbursedAmount,
        administrativeFee: withdrawalsAssociates.administrativeFee,
        paymentMethod: withdrawalsAssociates.paymentMethod,
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
        status: withdrawalsAssociates.status,
        isHouseComercial: withdrawalTypes.isHouseComercial,
        isInternalInventory: withdrawalTypes.isInternalInventory,
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

    const transformedData = data.map((item) => ({
      ...item,
      requestedAmount: Number(item.requestedAmount ?? 0).toFixed(2),
      disbursedAmount: Number(item.disbursedAmount ?? 0).toFixed(2),
      administrativeFee: Number(item.administrativeFee ?? 0).toFixed(2),
    }));

    return {
      data: transformedData,
      meta: {
        totalItems,
        itemCount: transformedData.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findOneRequest(tenantId: string, cedula: string) {
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
        and(
          eq(withdrawalsAssociates.associateAccountId, associateAccounts.id),
          eq(withdrawalsAssociates.tenantId, tenantId),
        ),
      )
      .leftJoin(
        associateHaberesBalance,
        eq(associateHaberesBalance.associateAccountId, associateAccounts.id),
      )
      .where(
        and(eq(associates.cedula, cedula), eq(associates.tenantId, tenantId)),
      )
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

    const associateId = result[0].id;
    const accountId = result[0].associateAccountId;

    const [totalLoansAssociate, totalCreditsAssociate, timeSetting, lastDisbursedWithdrawal] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(loans)
        .where(
          and(
            eq(loans.associateId, associateId),
            eq(loans.tenantId, tenantId),
            or(
              eq(loans.status, LoanStatusEnum.APPROVED),
              eq(loans.status, LoanStatusEnum.DISBURSED),
              eq(loans.status, LoanStatusEnum.IN_PAYMENT),
            ),
          ),
        ),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(credits)
        .where(
          and(
            eq(credits.associateId, associateId),
            eq(credits.tenantId, tenantId),
            or(
              eq(credits.status, CreditStatusEnum.APPROVED),
              eq(credits.status, CreditStatusEnum.IN_PAYMENT),
            ),
          ),
        ),
      this.db.query.moduleSettings.findFirst({
        where: and(
          eq(schema.moduleSettings.tenantId, tenantId),
          eq(schema.moduleSettings.module, 'savings'),
          eq(schema.moduleSettings.submodule, 'withdrawals'),
          eq(schema.moduleSettings.key, 'WITHDRAWAL_TIME_MONTHS'),
        ),
      }),
      accountId
        ? this.db
          .select({ withdrawalDate: withdrawalsAssociates.withdrawalDate })
          .from(withdrawalsAssociates)
          .where(
            and(
              eq(withdrawalsAssociates.associateAccountId, accountId),
              eq(withdrawalsAssociates.tenantId, tenantId),
              or(
                eq(withdrawalsAssociates.status, withdrawalStatusEnum.DISBURSED),
                eq(withdrawalsAssociates.status, withdrawalStatusEnum.PROCESSED),
              ),
            ),
          )
          .orderBy(desc(withdrawalsAssociates.withdrawalDate))
          .limit(1)
        : Promise.resolve([]),
    ]);

    const balance = Number(result[0].balance ?? 0);
    const hasActiveLoan = Number(totalLoansAssociate[0].count) > 0;
    const hasActiveCredit = Number(totalCreditsAssociate[0].count) > 0;
    const hasPayrollCredit = result[0].isPayrollCredit ?? false;
    const withdrawalTimeMonths = parseInt(timeSetting?.value ?? '0', 10);
    const lastWithdrawalDate = lastDisbursedWithdrawal.length > 0
      ? lastDisbursedWithdrawal[0].withdrawalDate
      : null;

    return {
      id: result[0].id,
      cedula: result[0].cedula,
      fullname: result[0].fullname,
      phone: result[0].phone,
      email: result[0].email,
      isPayrollCredit: hasPayrollCredit,
      associateAccountId: result[0].associateAccountId,
      accountNumber: result[0].accountNumber,
      balance: Number(balance.toFixed(2)),
      available80: Number((balance * 0.8).toFixed(2)),
      hasActiveLoan,
      hasActiveCredit,
      hasPayrollCredit,
      lastWithdrawalDate,
      withdrawalTimeMonths,
      totalLoansAssociate: Number(totalLoansAssociate[0].count),
      totalCreditsAssociate: Number(totalCreditsAssociate[0].count),
    };
  }

  async findAllByAssociate(
    tenantId: string,
    associateId: string,
    filtersDto: FilterWithdrawalAssociateDto,
  ) {
    const { page = 1, limit = 10 } = filtersDto;

    const accounts = await this.db.query.associateAccounts.findMany({
      where: eq(schema.associateAccounts.associateId, associateId),
      columns: {
        id: true,
      },
    });

    if (!accounts.length) {
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

    const accountIds = accounts.map((acc) => acc.id);

    const whereCondition = and(
      eq(withdrawalsAssociates.tenantId, tenantId),
      inArray(withdrawalsAssociates.associateAccountId, accountIds),
    );

    const totalCountResult = await this.db
      .select({ total: sql<number>`count(*)` })
      .from(withdrawalsAssociates)
      .where(whereCondition);

    const totalItems = Number(totalCountResult[0].total);

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
      .where(whereCondition)
      .orderBy(desc(withdrawalsAssociates.withdrawalDate))
      .limit(limit)
      .offset((page - 1) * limit);

    const formattedWithdrawals = withdrawals.map((w) => ({
      ...w,
      amount: parseFloat(w.amount).toFixed(2),
      disbursedAmount: parseFloat(w.disbursedAmount ?? '0').toFixed(2),
      administrativeFee: parseFloat(w.administrativeFee ?? '0').toFixed(2),
    }));

    return {
      data: formattedWithdrawals,
      meta: {
        totalItems,
        itemCount: formattedWithdrawals.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async remove(tenantId: string, userId: string, withdrawalId: string) {
    return await this.db.transaction(async (tx) => {
      const withdrawal = await tx.query.withdrawalsAssociates.findFirst({
        where: and(
          eq(withdrawalsAssociates.id, withdrawalId),
          eq(withdrawalsAssociates.tenantId, tenantId),
        ),
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
          .where(
            and(
              eq(withdrawalsAssociates.id, withdrawalId),
              eq(withdrawalsAssociates.tenantId, tenantId),
            ),
          );

        this.eventEmitter.emit(
          'audit.log',
          new AuditLogEvent({
            tableName: 'withdrawalsAssociates',
            recordId: withdrawalId,
            action: 'CANCELED',
            userId,
            area: 'savings_banks',
            description: `Cancelación de retiro ${referenceCode}`,
            newData: [{ status: 'CANCELED' }],
            tenantId,
          }),
        );

        return { message: `The retreat has been cancelled.` };
      } else if (status === 'DISBURSED') {
        await tx
          .update(withdrawalsAssociates)
          .set({ status: 'REVERSED', updatedById: userId })
          .where(
            and(
              eq(withdrawalsAssociates.id, withdrawalId),
              eq(withdrawalsAssociates.tenantId, tenantId),
            ),
          );

        const originalMovements = await tx
          .select()
          .from(schema.associateAccountMovements)
          .where(
            and(
              eq(schema.associateAccountMovements.referenceId, withdrawalId),
              eq(
                schema.associateAccountMovements.referenceType,
                'withdrawalsAssociates',
              ),
              eq(schema.associateAccountMovements.status, 'COMPLETED'),
            ),
          );

        const feeMovement = originalMovements.find(
          (m) =>
            m.movementType === AssociateMovementTypeEnum.WITHDRAWAL_FEE_DEBIT,
        );

        await this.associateAccountsMovementsService.create(
          userId,
          {
            associateAccountId: associateAccountId,
            movementType:
              'SAVING_WITHDRAWAL_REVERSAL_CREDIT' as AssociateMovementTypeEnum,
            amount: Number(disbursedAmount),
            currencyCode: 'VES' as CurrencyCodeEnum,
            description: `REVERSO RETIRO HABERES - REF: ${referenceCode}`,
            referenceId: withdrawalId,
            referenceType: 'withdrawalsAssociates',
            status: 'COMPLETED' as movementStatusEnum,
          },
          tenantId,
          tx,
        );

        if (feeMovement) {
          await this.associateAccountsMovementsService.create(
            userId,
            {
              associateAccountId: associateAccountId,
              movementType:
                'WITHDRAWAL_FEE_REVERSAL_CREDIT' as AssociateMovementTypeEnum,
              amount: Number(feeMovement.amount),
              currencyCode: feeMovement.currencyCode as CurrencyCodeEnum,
              description: `REVERSO GASTO ADMIN. RETIRO - REF: ${referenceCode}`,
              referenceId: withdrawalId,
              referenceType: 'withdrawalsAssociates',
              status: 'COMPLETED' as movementStatusEnum,
            },
            tenantId,
            tx,
          );
        }

        await tx
          .update(schema.associateAccountMovements)
          .set({ status: 'REVERSED' as movementStatusEnum })
          .where(
            and(
              eq(schema.associateAccountMovements.referenceId, withdrawalId),
              eq(
                schema.associateAccountMovements.referenceType,
                'withdrawalsAssociates',
              ),
              inArray(schema.associateAccountMovements.movementType, [
                AssociateMovementTypeEnum.SAVING_WITHDRAWAL,
                AssociateMovementTypeEnum.WITHDRAWAL_FEE_DEBIT,
              ]),
            ),
          );

        const [entry] = await tx
          .select()
          .from(schema.accountingEntries)
          .where(
            and(
              eq(schema.accountingEntries.originReferenceId, withdrawalId),
              eq(
                schema.accountingEntries.originType,
                'WITHDRAWAL_DISBURSEMENT',
              ),
            ),
          );

        if (entry && entry.status === 'POSTED') {
          await this.withdrawalAccountingService.cancelWithdrawalEntry(
            userId,
            tenantId,
            entry.id,
          );
        }

        this.eventEmitter.emit(
          'audit.log',
          new AuditLogEvent({
            tableName: 'withdrawalsAssociates',
            recordId: withdrawalId,
            action: 'REVERSED',
            userId,
            area: 'savings_banks',
            description: `Reverso de retiro ${referenceCode}`,
            newData: [{ status: 'REVERSED' }],
            tenantId,
          }),
        );

        return { message: `El retiro ${referenceCode} ha sido reversado.` };
      } else {
        throw new BadRequestException(
          `A withdrawal with that status cannot be cancelled or reversed.`,
        );
      }
    });
  }

  async findWithdrawalAprovee(
    tenantId: string,
    paginationDto: FilterWithdrawalAssociateDto,
  ) {
    const { page = 1, limit = 10, search = '' } = paginationDto || {};
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [
      eq(withdrawalsAssociates.status, 'APPROVED'),
      eq(withdrawalsAssociates.tenantId, tenantId),
      eq(withdrawalTypes.isHouseComercial, false),
      eq(withdrawalTypes.isInternalInventory, false),
    ];

    if (search) {
      conditions.push(ilike(associates.cedula, `%${search}%`));
    }

    const where = and(...conditions);

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(withdrawalsAssociates)
      .leftJoin(
        associateAccounts,
        eq(associateAccounts.id, withdrawalsAssociates.associateAccountId),
      )
      .leftJoin(associates, eq(associates.id, associateAccounts.associateId))
      .leftJoin(
        withdrawalTypes,
        eq(withdrawalTypes.id, withdrawalsAssociates.withdrawalTypeId),
      )
      .where(where);

    const totalItems = Number(totalCountResult[0].count);

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
      .leftJoin(
        withdrawalTypes,
        eq(withdrawalTypes.id, withdrawalsAssociates.withdrawalTypeId),
      )
      .where(where)
      .limit(limit)
      .offset(offset);

    return {
      data: result,
      meta: {
        totalItems,
        itemCount: result.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findWithdrawalDetails(tenantId: string, id: string) {
    type WithdrawalItem = {
      days: number | null;
      itemId: string;
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
      .where(
        and(
          eq(withdrawalsAssociates.id, id),
          eq(withdrawalsAssociates.tenantId, tenantId),
        ),
      )
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

  async disburse(
    tenantId: string,
    userId: string,
    id: string,
    dto: DisburseWithdrawalAssociateDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const executeInTransaction = async (trx: any) => {
      const [withdrawal] = await trx
        .select()
        .from(withdrawalsAssociates)
        .where(
          and(
            eq(withdrawalsAssociates.id, id),
            eq(withdrawalsAssociates.tenantId, tenantId),
          ),
        )
        .leftJoin(
          associateAccounts,
          eq(withdrawalsAssociates.associateAccountId, associateAccounts.id),
        )
        .leftJoin(associates, eq(associateAccounts.associateId, associates.id))
        .leftJoin(
          withdrawalTypes,
          eq(withdrawalsAssociates.withdrawalTypeId, withdrawalTypes.id),
        );

      if (!withdrawal) throw new NotFoundException('Retiro no encontrado');

      const withdrawalRecord = withdrawal.withdrawals_associates;
      const withdrawalTypeRecord = withdrawal.withdrawal_types;
      const associateRecord = withdrawal.associates;

      if (!associateRecord) {
        throw new NotFoundException(
          'El retiro no tiene un asociado vinculado',
        );
      }

      if (withdrawalRecord.status !== withdrawalStatusEnum.APPROVED) {
        throw new BadRequestException(
          `Solo se pueden desembolsar retiros aprobados`,
        );
      }

      await trx
        .update(schema.associateAccountMovements)
        .set({
          status: 'COMPLETED' as movementStatusEnum,
        })
        .where(
          and(
            eq(
              schema.associateAccountMovements.referenceId,
              withdrawalRecord.id,
            ),
            eq(
              schema.associateAccountMovements.referenceType,
              'withdrawalsAssociates',
            ),
            inArray(schema.associateAccountMovements.movementType, [
              AssociateMovementTypeEnum.SAVING_WITHDRAWAL,
              AssociateMovementTypeEnum.WITHDRAWAL_FEE_DEBIT,
            ]),
          ),
        );

      await this.withdrawalAccountingService.generateDisbursementEntry(
        tenantId,
        userId,
        {
          withdrawalId: withdrawalRecord.id,
          associateId: associateRecord.id,
          associateFullname: associateRecord.fullname,
          associateCedula: associateRecord.cedula ?? '',
          withdrawalTypeDescription: withdrawalTypeRecord?.description ?? 'RETIRO DE HABERES',
          requestedAmount: Number(withdrawal.withdrawals_associates.requestedAmount),
          administrativeFee: Number(withdrawal.withdrawals_associates.administrativeFee),
          disbursedAmount: Number(withdrawal.withdrawals_associates.disbursedAmount),
          entryDate: new Date(dto.processedAt),
        },
        trx,
      );

      const dataBank = {
        movement: {
          bankAccountId: dto.bankAccountId,
          transactionDate: new Date(dto.processedAt),
          paymentMethod: paymentMethodEnum.BANK_TRANSFER,
          description: `Desembolso de Retiro - ${withdrawalRecord.referenceCode}`,
          bankReference: dto.bankReference,
          category: 'MEMBER_WITHDRAWAL' as BankTransactionCategory,
          creditAmount: 0,
          debitAmount:
            Number(withdrawal.withdrawals_associates.disbursedAmount) ?? 0,
          createdById: userId,
        },
        links: [
          {
            internalRecordType: 'MEMBER_WITHDRAWAL',
            internalRecordId: withdrawalRecord.id,
          },
        ],
      };

      const bankResult = await this.bankMovementsService.createAndReconcile(
        dataBank,
        userId,
        trx,
      );

      const [updated] = await trx
        .update(withdrawalsAssociates)
        .set({
          status: withdrawalStatusEnum.DISBURSED,
          bankTransactionId: bankResult.movement.id,
          updatedById: userId,
        })
        .where(
          and(
            eq(withdrawalsAssociates.id, id),
            eq(withdrawalsAssociates.tenantId, tenantId),
          ),
        )
        .returning();

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'withdrawalsAssociates',
          recordId: id,
          action: 'UPDATE',
          userId,
          area: 'savings_banks',
          description: `Desembolso de retiro procesado exitosamente. Ref: ${dto.bankReference}`,
          newData: [updated],
          previousData: [withdrawalRecord],
          tenantId,
        }),
      );

      return {
        message: 'Desembolso procesado exitosamente',
        withdrawal: updated,
      };
    };

    return tx
      ? executeInTransaction(tx)
      : this.db.transaction(executeInTransaction);
  }

  async process(tenantId: string, userId: string, id: string) {
    return this.db.transaction(async (tx) => {
      const [withdrawal] = await tx
        .select()
        .from(withdrawalsAssociates)
        .where(
          and(
            eq(withdrawalsAssociates.id, id),
            eq(withdrawalsAssociates.tenantId, tenantId),
          ),
        )
        .leftJoin(
          associateAccounts,
          eq(withdrawalsAssociates.associateAccountId, associateAccounts.id),
        )
        .leftJoin(associates, eq(associateAccounts.associateId, associates.id))
        .leftJoin(
          withdrawalTypes,
          eq(withdrawalsAssociates.withdrawalTypeId, withdrawalTypes.id),
        );

      if (!withdrawal) throw new NotFoundException('Retiro no encontrado');

      const withdrawalRecord = withdrawal.withdrawals_associates;
      const withdrawalTypeRecord = withdrawal.withdrawal_types;
      const associateRecord = withdrawal.associates;

      if (!associateRecord) {
        throw new NotFoundException(
          'El retiro no tiene un asociado vinculado',
        );
      }

      const isGoodsWithdrawal =
        withdrawalRecord.commercialHouseId != null ||
        (Array.isArray(withdrawalRecord.withdrawalItems) &&
          withdrawalRecord.withdrawalItems.length > 0);

      if (withdrawalRecord.status !== withdrawalStatusEnum.APPROVED) {
        throw new BadRequestException(
          `Solo se pueden procesar retiros aprobados`,
        );
      }

      await tx
        .update(schema.associateAccountMovements)
        .set({
          status: 'COMPLETED' as movementStatusEnum,
        })
        .where(
          and(
            eq(
              schema.associateAccountMovements.referenceId,
              withdrawalRecord.id,
            ),
            eq(
              schema.associateAccountMovements.referenceType,
              'withdrawalsAssociates',
            ),
            inArray(schema.associateAccountMovements.movementType, [
              AssociateMovementTypeEnum.SAVING_WITHDRAWAL,
              AssociateMovementTypeEnum.WITHDRAWAL_FEE_DEBIT,
            ]),
          ),
        );

      await this.withdrawalAccountingService.generateProcessingEntry(
        tenantId,
        userId,
        {
          withdrawalId: withdrawalRecord.id,
          associateId: associateRecord.id,
          associateFullname: associateRecord.fullname,
          associateCedula: associateRecord.cedula ?? '',
          withdrawalTypeDescription: withdrawalTypeRecord?.description ?? 'RETIRO DE HABERES',
          withdrawalDate: new Date(withdrawal.withdrawals_associates.withdrawalDate) ?? new Date(),
          requestedAmount: Number(withdrawal.withdrawals_associates.requestedAmount),
          administrativeFee: Number(withdrawal.withdrawals_associates.administrativeFee),
          disbursedAmount: Number(withdrawal.withdrawals_associates.disbursedAmount),
        },
        tx,
      );

      if (Array.isArray(withdrawalRecord.withdrawalItems)) {
        for (const item of withdrawalRecord.withdrawalItems) {
          if (item.itemType === 'PRODUCT') {
            await this.inventoryMovementsService.create(
              {
                movementType: 'STOCK_DELIVERY',
                description: `Salida Producto por retiro ${withdrawalTypeRecord?.description} Ref: ${withdrawalRecord.referenceCode}`,
                items: [
                  {
                    productId: item.itemId ?? 0,
                    quantity: item.quantity,
                    unitCost: Number(item.agreedSellingPrice),
                  },
                ],
              },
              tenantId,
              userId,
              tx,
            );
          }
        }
      }

      const [updated] = await tx
        .update(withdrawalsAssociates)
        .set({
          status: withdrawalStatusEnum.PROCESSED,
          updatedById: userId,
        })
        .where(
          and(
            eq(withdrawalsAssociates.id, id),
            eq(withdrawalsAssociates.tenantId, tenantId),
          ),
        )
        .returning();

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'withdrawalsAssociates',
          recordId: id,
          action: 'UPDATE',
          userId,
          area: 'savings_banks',
          description: `Retiro procesado exitosamente por ${withdrawalTypeRecord?.description}`,
          newData: [updated],
          previousData: [withdrawalRecord],
          tenantId,
        }),
      );

      return {
        message: 'retiro procesado exitosamente',
        withdrawal: updated,
      };
    });
  }
}
