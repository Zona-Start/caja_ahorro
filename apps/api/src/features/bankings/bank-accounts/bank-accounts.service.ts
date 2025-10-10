import * as schema from '@/database';
import {
  accountingBalanceByBank,
  bankStatementBalance,
  currencies,
} from '@/database';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { CurrencyCodeEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AccountingEntriesService } from '../../accounting/accounting-entries/accounting-entries.service';
import { CreateAccountingEntryDto } from '../../accounting/accounting-entries/dto/create-accounting-entry.dto';
import { SettingsSystemService } from '../../core/settings-system/settings-system.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { FilterBankAccountDto } from './dto/filter-bank-account.dto';
import { InitialReconciliationDto } from './dto/initial-reconciliation.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Injectable()
export class BankAccountsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private drizzle: NodePgDatabase<typeof schema>,
    private readonly accountingEntriesService: AccountingEntriesService,
    private readonly settingsSystemService: SettingsSystemService,
  ) {}

  private async _createOpeningEntry(
    tx: NodePgDatabase<typeof schema>,
    userId: number,
    bankAccount: any, // Debería ser un tipo más específico
  ) {
    const [openCycle] = await tx
      .select()
      .from(schema.accountingCycles)
      .where(
        and(
          eq(schema.accountingCycles.companyId, bankAccount.companyId),
          eq(schema.accountingCycles.status, 'OPEN'),
        ),
      );

    if (!openCycle) {
      throw new BadRequestException(
        'No se encontró un ciclo contable abierto para la compañía.',
      );
    }

    const [adjConfig] = await tx
      .select()
      .from(schema.accountingConfiguration)
      .where(
        and(
          eq(schema.accountingConfiguration.companyId, bankAccount.companyId),
          eq(
            schema.accountingConfiguration.operationType,
            'INITIAL_BALANCE_BANK',
          ),
        ),
      );

    if (!adjConfig) {
      throw new BadRequestException(
        'No se ha configurado un ajustes de balance inicial para cuentas (INITIAL_BALANCE_BANK).',
      );
    }

    // const capitalAccountSetting = await this.settingsSystemService.findKey(
    //   'CAPITAL_ACCOUNT_ID',
    // );
    // if (!capitalAccountSetting || !capitalAccountSetting.value) {
    //   throw new BadRequestException(
    //     'No se ha configurado la cuenta de contrapartida para la apertura de bancos (CAPITAL_ACCOUNT_ID).',
    //   );
    // }

    const capitalAccountId = Number(adjConfig.creditAccountId);

    const entryDto: CreateAccountingEntryDto = {
      companyId: bankAccount.companyId,
      accountingCycleId: openCycle.id,
      entryDate: new Date(bankAccount.openingDate || Date.now()),
      description: `Apertura de cuenta bancaria: ${bankAccount.accountName}`,
      currencyCode: bankAccount.currencyCode as CurrencyCodeEnum,
      originType: 'BANK_ACCOUNT',
      originReferenceId: bankAccount.id.toString(),
      details: [
        {
          accountPlanId: bankAccount.linkedChartAccountId,
          debit: Number(bankAccount.currentBalance),
          credit: 0,
          description: 'Saldo inicial en banco',
        },
        {
          accountPlanId: capitalAccountId,
          debit: 0,
          credit: Number(bankAccount.currentBalance),
          description: 'Capital/Apertura de cuenta',
        },
      ],
    };

    const res = await this.accountingEntriesService.create(userId, entryDto);

    if (res && res.id) {
      await this.accountingEntriesService.submitEntry(userId, res.id);
      await this.accountingEntriesService.postEntry(userId, res.id);
    }
  }

  async initialReconciliation(userId: number, dto: InitialReconciliationDto) {
    return this.drizzle.transaction(async (tx) => {
      // 1. Buscar cuenta bancaria
      const [bankAccount] = await tx
        .select()
        .from(schema.bankAccounts)
        .where(eq(schema.bankAccounts.id, dto.bankAccountId));

      if (!bankAccount) {
        throw new NotFoundException(
          `Cuenta bancaria con ID ${dto.bankAccountId} no encontrada.`,
        );
      }

      // 2. Saldo según libros
      const [bookBalance] = await tx
        .select()
        .from(schema.accountingBalanceByBank)
        .where(
          eq(schema.accountingBalanceByBank.bankAccountId, bankAccount.id),
        );

      const finalBookBalance = bookBalance ? Number(bookBalance.totalDebit) : 0;
      const difference = finalBookBalance - Number(dto.lastStatementBalance);

      // 3. Actualizar cuenta
      await tx
        .update(schema.bankAccounts)
        .set({
          lastStatementBalance: dto.lastStatementBalance.toString(),
          lastStatementDate: dto.lastStatementDate.toISOString().split('T')[0],
          openingConciliationPosted: true,
          updatedById: userId,
        })
        .where(eq(schema.bankAccounts.id, dto.bankAccountId));

      // 4. Movimiento bancario inicial (siempre)}
      // 2. Comprueba el tipo que INFIERE Drizzle

      const [openingTx] = await tx
        .insert(schema.bankTransactions)
        .values({
          bankAccountId: dto.bankAccountId,
          paymentMethod: 'OTHER',
          transactionDate: dto.lastStatementDate.toISOString(),
          valueDate: dto.lastStatementDate.toISOString(),
          description: 'Saldo inicial extracto',
          category: 'OPENING_BANK',
          creditAmount: dto.lastStatementBalance.toString(),
          debitAmount: '0',
          resultingBalance: dto.lastStatementBalance.toString(),
          reconciliationStatus: 'PENDING',
          bankReference: 'Apertura de Cuenta',
          uploadBatchId: 'INITIAL_RECON',
          note: 'Movimiento creado automáticamente en conciliación inicial',
          createdById: userId,
          internalLinkStatus: 'NOT_APPLICABLE',
        })
        .returning();

      let adjustmentEntryId: number | null = null;
      let bookBalanceAfter = finalBookBalance;

      // 5. CASO A: Sin ajuste → dejar diferencia pendiente
      if (!dto.createAdjustment) {
        // Conciliación con diferencia abierta
        if (difference === 0) {
          await tx
            .update(schema.bankTransactions)
            .set({ reconciliationStatus: 'RECONCILED', updatedById: userId })
            .where(eq(schema.bankTransactions.id, openingTx.id));
        }
        const [recon] = await tx
          .insert(schema.bankReconciliations)
          .values({
            bankAccountId: dto.bankAccountId,
            statementDate: dto.lastStatementDate.toISOString(),
            statementEndingBalance: dto.lastStatementBalance.toString(),
            bookBalanceBefore: finalBookBalance.toString(),
            bookBalanceAfter: finalBookBalance.toString(),
            difference: difference.toString(),
            reconciliationDate: dto.reconciliationDate,
            status: difference === 0 ? 'COMPLETED' : 'PENDING',
            preparedByUserId: userId,
            notes:
              difference === 0
                ? 'Conciliación inicial rápida (ya cuadrada)'
                : 'Conciliación inicial rápida - diferencia pendiente',
            createdById: userId,
          })
          .returning();

        // Relacionar movimiento opening
        await tx.insert(schema.bankReconciliationDetails).values({
          bankReconciliationId: recon.id,
          adjustmentType: 'OPENING_BALANCE',
          adjustmentAmount: '0',
          description: 'Saldo inicial extracto',
          isBookAdjustment: false,
          bankTransactionId: openingTx.id,
          createdById: userId,
        });

        return { reconciliationId: recon.id, difference, status: recon.status };
      }

      // 6. CASO B: Con ajuste → cerrar en 0
      // 6-a. Buscar ciclo abierto
      const [cycle] = await tx
        .select()
        .from(schema.accountingCycles)
        .where(
          and(
            eq(schema.accountingCycles.companyId, bankAccount.companyId),
            eq(schema.accountingCycles.status, 'OPEN'),
          ),
        );

      if (!cycle) {
        throw new BadRequestException(
          'No hay ciclo contable abierto para crear el ajuste.',
        );
      }

      // 6-b. Configuración de contra-cuenta
      const [adjConfig] = await tx
        .select()
        .from(schema.accountingConfiguration)
        .where(
          and(
            eq(schema.accountingConfiguration.companyId, bankAccount.companyId),
            eq(
              schema.accountingConfiguration.operationType,
              'BANK_RECONCILIATION_ADJUSTMENT',
            ),
          ),
        );

      if (!adjConfig?.contraAccountId) {
        throw new BadRequestException(
          'No se ha configurado contra cuenta para ajustes de conciliación.',
        );
      }

      // 6-c. Armar asiento de ajuste
      const adjustmentAmount = Math.abs(difference);
      const isPositiveDiff = difference > 0; // libro > banco
      const debitAccountId = isPositiveDiff
        ? adjConfig.contraAccountId
        : bankAccount.linkedChartAccountId;
      const creditAccountId = isPositiveDiff
        ? bankAccount.linkedChartAccountId
        : adjConfig.contraAccountId;

      const entryDto: CreateAccountingEntryDto = {
        companyId: bankAccount.companyId,
        accountingCycleId: cycle.id,
        entryDate: dto.reconciliationDate,
        description: `Ajuste por conciliación inicial - Cta. ${bankAccount.accountName}`,
        currencyCode: bankAccount.currencyCode as CurrencyCodeEnum,
        originType: 'BANK_RECONCILIATION_INITIAL_ADJUSTMENT',
        details: [
          {
            accountPlanId: debitAccountId,
            debit: adjustmentAmount,
            credit: 0,
            description: 'Ajuste por conciliación inicial',
          },
          {
            accountPlanId: creditAccountId,
            debit: 0,
            credit: adjustmentAmount,
            description: 'Ajuste por conciliación inicial',
          },
        ],
      };

      // 6-d. Crear y postear asiento
      const newEntry = await this.accountingEntriesService.create(
        userId,
        entryDto,
      );
      await this.accountingEntriesService.submitEntry(userId, newEntry.id!);
      await this.accountingEntriesService.postEntry(userId, newEntry.id!);
      adjustmentEntryId = newEntry.id!;
      bookBalanceAfter = dto.lastStatementBalance;

      // 6-e. Crear movimiento bancario de ajuste (opcional pero útil)
      // const [adjustTx] = await tx
      //   .insert(schema.bankTransactions)
      //   .values({
      //     bankAccountId: dto.bankAccountId,
      //     transactionType: 'INITIAL_ADJUSTMENT_BANK',
      //     transactionDate: dto.reconciliationDate,
      //     valueDate: dto.reconciliationDate,
      //     description: 'Ajuste por conciliación inicial',
      //     creditAmount: isPositiveDiff ? adjustmentAmount.toString() : '0',
      //     debitAmount: isPositiveDiff ? '0' : adjustmentAmount.toString(),
      //     resultingBalance: dto.lastStatementBalance.toString(),
      //     reconciliationStatus: 'ADJUSTMENT',
      //     bankReference: 'AJUSTE_INICIAL',
      //     uploadBatchId: 'INITIAL_ADJUST',
      //     note: 'Movimiento de ajuste creado automáticamente en conciliación inicial',
      //     createdById: userId,
      //   })
      //   .returning();

      // 6-f. Conciliación CERRADA en 0
      const [recon] = await tx
        .insert(schema.bankReconciliations)
        .values({
          bankAccountId: dto.bankAccountId,
          statementDate: dto.lastStatementDate.toISOString(),
          statementEndingBalance: dto.lastStatementBalance.toString(),
          bookBalanceBefore: finalBookBalance.toString(),
          bookBalanceAfter: bookBalanceAfter.toString(),
          difference: '0',
          reconciliationDate: dto.reconciliationDate,
          status: 'COMPLETED',
          preparedByUserId: userId,
          notes: 'Conciliación inicial completa (cerrada en 0)',
        })
        .returning();

      // 6-g. Detalles de conciliación
      const details = [
        {
          bankReconciliationId: recon.id,
          adjustmentType: 'OPENING_BALANCE',
          adjustmentAmount: '0',
          description: 'Saldo inicial extracto',
          isBookAdjustment: false,
          bankTransactionId: openingTx.id,
        },
        // {
        //   bankReconciliationId: recon.id,
        //   adjustmentType: 'BOOK_ADJUSTMENT',
        //   adjustmentAmount: adjustmentAmount.toString(),
        //   description: 'Ajuste por conciliación inicial',
        //   isBookAdjustment: true,
        //   adjustmentEntryId: adjustmentEntryId,
        //   bankTransactionId: adjustTx.id,
        // },
      ];

      await tx.insert(schema.bankReconciliationDetails).values(details);

      // 6-h. ACTUALIZAR resulting_balance del movimiento opening
      await tx
        .update(schema.bankTransactions)
        .set({ resultingBalance: dto.lastStatementBalance.toString() })
        .where(eq(schema.bankTransactions.id, openingTx.id));

      return {
        reconciliationId: recon.id,
        difference: 0,
        status: 'COMPLETED',
        adjustmentEntryId,
      };
    });
  }

  async findAll() {
    return await this.drizzle
      .select({
        id: schema.bankAccounts.id,
        bankDirectoryId: schema.bankAccounts.bankDirectoryId,
        bankDirectoryName: schema.bankDirectory.name,
        accountNumber: schema.bankAccounts.accountNumber,
        accountName: schema.bankAccounts.accountName,
      })
      .from(schema.bankAccounts)
      .leftJoin(
        schema.bankDirectory,
        eq(schema.bankDirectory.id, schema.bankAccounts.bankDirectoryId),
      )
      .where(eq(schema.bankAccounts.isActive, true));
  }

  async findOne(id: number) {
    const result = await this.drizzle
      .select()
      .from(schema.bankAccounts)
      .where(eq(schema.bankAccounts.id, id));

    if (!result.length) {
      throw new NotFoundException(`Bank Account with ID ${id} not found`);
    }

    return result[0];
  }

  async findAllByPagination(filterBankAccountDto?: FilterBankAccountDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      status,
      accountType,
      currencyCode,
    } = filterBankAccountDto || {};

    const offset = (page - 1) * limit;
    let searchCondition: SQL<unknown> | undefined;
    if (search) {
      searchCondition = ilike(schema.bankAccounts.accountNumber, `%${search}%`);
    }

    if (accountType) {
      searchCondition = searchCondition
        ? sql`${searchCondition} AND ${schema.bankAccounts.accountType} = ${accountType}`
        : sql`${schema.bankAccounts.accountType} = ${accountType}`;
    }

    if (currencyCode) {
      searchCondition = searchCondition
        ? sql`${searchCondition} AND ${schema.bankAccounts.currencyCode} = ${currencyCode}`
        : sql`${schema.bankAccounts.currencyCode} = ${currencyCode}`;
    }

    if (status) {
      const transforStatus = status === 'ACTIVE' ? true : false;
      searchCondition = searchCondition
        ? sql`${searchCondition} AND ${schema.bankAccounts.isActive} = ${transforStatus}`
        : sql`${schema.bankAccounts.isActive} = ${transforStatus}`;
    }

    const orderBy =
      sortOrder === 'asc'
        ? sql`${schema.bankAccounts[sortBy as keyof typeof schema.bankAccounts]} asc`
        : sql`${schema.bankAccounts[sortBy as keyof typeof schema.bankAccounts]} desc`;

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.bankAccounts)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.drizzle
      .select({
        id: schema.bankAccounts.id,
        companyId: schema.bankAccounts.companyId,
        bankDirectoryId: schema.bankAccounts.bankDirectoryId,
        bankDirectoryName: schema.bankDirectory.name,
        accountNumber: schema.bankAccounts.accountNumber,
        accountName: schema.bankAccounts.accountName,
        accountType: schema.bankAccounts.accountType,
        currencyCode: schema.bankAccounts.currencyCode,
        openingDate: schema.bankAccounts.openingDate,
        //currentBalance: schema.bankAccounts.currentBalance,
        //lastStatementBalance: schema.bankAccounts.lastStatementBalance,
        lastStatementDate: schema.bankAccounts.lastStatementDate,
        linkedChartAccountId: schema.bankAccounts.linkedChartAccountId,
        isActive: schema.bankAccounts.isActive,
        openingEntryPosted: schema.bankAccounts.openingEntryPosted,
        openingConciliationPosted:
          schema.bankAccounts.openingConciliationPosted,
        currentBalance: accountingBalanceByBank.balance,
        lastStatementBalance: bankStatementBalance.currentStatementBalance,
      })
      .from(schema.bankAccounts)
      .where(searchCondition)
      .leftJoin(
        schema.bankDirectory,
        eq(schema.bankDirectory.id, schema.bankAccounts.bankDirectoryId),
      )
      // Saldo contable (por cuenta y moneda)
      .leftJoin(
        accountingBalanceByBank,
        eq(accountingBalanceByBank.bankAccountId, schema.bankAccounts.id),
      )

      // Saldo bancario (por cuenta)
      .leftJoin(
        bankStatementBalance,
        eq(bankStatementBalance.bankAccountId, schema.bankAccounts.id),
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

    const transformData = data.map((item) => ({
      ...item,
      accountName: item.accountName ?? undefined,
      currencyCode: item.currencyCode as CurrencyCodeEnum,
      openingDate: item.openingDate ? new Date(item.openingDate) : undefined,
      currentBalance: item.currentBalance,
      lastStatementBalance: item.lastStatementBalance,
      lastStatementDate: item.lastStatementDate
        ? new Date(item.lastStatementDate)
        : undefined,
    }));

    return {
      data: transformData,
      meta,
    };
  }

  async create(userId: number, data: CreateBankAccountDto) {
    return this.drizzle.transaction(async (tx) => {
      const existingAccount = await tx
        .select()
        .from(schema.bankAccounts)
        .where(eq(schema.bankAccounts.accountNumber, data.accountNumber));

      if (existingAccount.length) {
        throw new Error(
          `Bank Account with account number ${data.accountNumber} already exists`,
        );
      }
      const currenciesCode = await tx
        .select()
        .from(currencies)
        .where(eq(currencies.id, Number(data.currencyCode)));

      const formatData = {
        ...data,
        currencyCode: currenciesCode[0].code,
        openingDate: data.openingDate
          ? new Date(data.openingDate).toISOString().split('T')[0]
          : null,
        currentBalance: data.currentBalance
          ? (data.currentBalance ?? 0).toString()
          : null,
        lastStatementBalance: data.lastStatementBalance?.toString() ?? null,
        lastStatementDate: data.lastStatementDate
          ? new Date(data.lastStatementDate).toISOString().split('T')[0]
          : null,
        createdById: userId,
        openingEntryPosted: data.openingEntryPosted ?? false,
      };

      const [newBankAccount] = await tx
        .insert(schema.bankAccounts)
        .values(formatData)
        .returning();

      if (data.openingEntryPosted) {
        await this._createOpeningEntry(tx, userId, newBankAccount);
      }

      return newBankAccount;
    });
  }

  async update(id: number, userId: number, data: UpdateBankAccountDto) {
    return this.drizzle.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(schema.bankAccounts)
        .where(eq(schema.bankAccounts.id, id));

      if (!existing) {
        throw new NotFoundException(`Bank Account with ID ${id} not found`);
      }

      const currenciesCode = await tx
        .select()
        .from(currencies)
        .where(eq(currencies.id, Number(data.currencyCode)));

      const formatData = {
        ...data,
        currencyCode: currenciesCode[0].code,
        openingDate: data.openingDate
          ? new Date(data.openingDate).toISOString()
          : null,
        currentBalance: (data.currentBalance ?? 0).toString(),
        lastStatementBalance: data.lastStatementBalance?.toString() ?? null,
        lastStatementDate: data.lastStatementDate
          ? new Date(data.lastStatementDate).toISOString()
          : null,
        updatedById: userId,
        openingEntryPosted: data.openingEntryPosted ?? false,
      };

      const [updatedBankAccount] = await tx
        .update(schema.bankAccounts)
        .set(formatData)
        .where(eq(schema.bankAccounts.id, id))
        .returning();

      if (data.openingEntryPosted && !existing.openingEntryPosted) {
        await this._createOpeningEntry(tx, userId, updatedBankAccount);
      }

      return updatedBankAccount;
    });
  }

  async remove(id: number) {
    const existing = await this.findOne(id);

    if (!existing) {
      throw new NotFoundException(`Bank Account with ID ${id} not found`);
    }

    await this.drizzle
      .delete(schema.bankAccounts)
      .where(eq(schema.bankAccounts.id, id));

    return { message: 'Bank Account deleted successfully' };
  }
}
