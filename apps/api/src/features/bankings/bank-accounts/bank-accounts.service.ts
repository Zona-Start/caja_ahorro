import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { currencies } from '@/database/schema';
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
import { CreateBankAccountDto } from './dto/bank-accounts.schema';
import { FilterBankAccountDto } from './dto/filter-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Injectable()
export class BankAccountsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private drizzle: NodePgDatabase<typeof schema>,
    private readonly accountingEntriesService: AccountingEntriesService,
  ) {}

  async findAll(tenantId: string) {
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
      .where(
        and(
          eq(schema.bankAccounts.isActive, true),
          eq(schema.bankAccounts.tenantId, tenantId),
        ),
      );
  }

  async findOne(id: string, tenantId: string) {
    const result = await this.drizzle
      .select()
      .from(schema.bankAccounts)
      .where(
        and(
          eq(schema.bankAccounts.id, id),
          eq(schema.bankAccounts.tenantId, tenantId),
        ),
      );

    if (!result.length) {
      throw new NotFoundException(`Bank Account with ID ${id} not found`);
    }

    return result[0];
  }

  async findAllByPagination(
    filterBankAccountDto?: FilterBankAccountDto,
    tenantId?: string,
  ) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      accountType,
      currencyCode,
      sortOrder,
      sortBy,
    } = filterBankAccountDto || {};

    const offset = (page - 1) * limit;
    let searchCondition: SQL<unknown> | undefined;
    if (tenantId) {
      searchCondition = eq(schema.bankAccounts.tenantId, tenantId);
    }

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
        tenantId: schema.bankAccounts.tenantId,
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
        // currentBalance: accountingBalanceByBank.balance,
        // lastStatementBalance: bankStatementBalance.currentStatementBalance,
      })
      .from(schema.bankAccounts)
      .where(searchCondition)
      .leftJoin(
        schema.bankDirectory,
        eq(schema.bankDirectory.id, schema.bankAccounts.bankDirectoryId),
      )
      // Saldo contable (por cuenta y moneda)
      // .leftJoin(
      //   accountingBalanceByBank,
      //   eq(accountingBalanceByBank.bankAccountId, schema.bankAccounts.id),
      // )

      // // Saldo bancario (por cuenta)
      // .leftJoin(
      //   bankStatementBalance,
      //   eq(bankStatementBalance.bankAccountId, schema.bankAccounts.id),
      // )
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
      // currentBalance: item.currentBalance,
      // lastStatementBalance: item.lastStatementBalance,
      lastStatementDate: item.lastStatementDate
        ? new Date(item.lastStatementDate)
        : undefined,
    }));

    return {
      data: transformData,
      meta,
    };
  }

  async create(userId: string, tenantId: string, data: CreateBankAccountDto) {
    return this.drizzle.transaction(async (tx) => {
      const existingAccount = await tx
        .select()
        .from(schema.bankAccounts)
        .where(
          and(
            eq(schema.bankAccounts.accountNumber, data.accountNumber),
            eq(schema.bankAccounts.tenantId, tenantId),
          ),
        );

      if (existingAccount.length) {
        throw new BadRequestException(
          `La cuenta bancaria con número ${data.accountNumber} ya existe`,
        );
      }

      const currenciesCode = await tx
        .select()
        .from(currencies)
        .where(eq(currencies.id, data.currencyCode));

      if (!currenciesCode.length) {
        throw new BadRequestException(
          `No se encontró la moneda con ID ${data.currencyCode}`,
        );
      }

      const formatData = {
        tenantId: tenantId,
        bankDirectoryId: data.bankDirectoryId,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        accountType: data.accountType,
        currencyCode: currenciesCode[0].code,
        openingDate: data.openingDate
          ? new Date(data.openingDate).toISOString().split('T')[0]
          : null,
        linkedChartAccountId: data.linkedChartAccountId,
        isActive: data.isActive ?? true,
        openingEntryPosted: false,
        createdById: userId,
      };

      const [newBankAccount] = await tx
        .insert(schema.bankAccounts)
        .values(formatData)
        .returning();

      // Si se solicita generar el asiento de apertura
      // if (
      //   data.openingEntryPosted &&
      //   data.currentBalance &&
      //   data.currentBalance > 0
      // ) {
      //   if (!data.accountingRuleId) {
      //     throw new BadRequestException(
      //       'Debe seleccionar una regla contable para generar el asiento de apertura.',
      //     );
      //   }

      //   //revisar el asiento contable aqui
      //   await this._createOpeningEntry(
      //     tx,
      //     userId,
      //     newBankAccount,
      //     data.currentBalance,
      //     data.accountingRuleId,
      //     data.openingDate
      //       ? new Date(data.openingDate).toISOString()
      //       : undefined,
      //   );

      //   // Marcar que ya se generó el asiento de apertura
      //   await tx
      //     .update(schema.bankAccounts)
      //     .set({
      //       openingEntryPosted: true,
      //       currentBalance: String(data.currentBalance),
      //       ruleAccountId: data.accountingRuleId,
      //     })
      //     .where(eq(schema.bankAccounts.id, newBankAccount.id));
      // }

      return newBankAccount;
    });
  }

  async update(
    id: string,
    userId: string,
    data: UpdateBankAccountDto,
    tenantId: string,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(schema.bankAccounts)
        .where(
          and(
            eq(schema.bankAccounts.id, id),
            eq(schema.bankAccounts.tenantId, tenantId),
          ),
        );

      if (!existing) {
        throw new NotFoundException(`Bank Account with ID ${id} not found`);
      }

      // No permitir cambios si ya se generó el asiento de apertura
      if (existing.openingEntryPosted && data.openingEntryPosted) {
        throw new BadRequestException(
          'No se puede generar el asiento de apertura porque ya fue generado previamente.',
        );
      }

      const currenciesCode = await tx
        .select()
        .from(currencies)
        .where(eq(currencies.code, data.currencyCode as CurrencyCodeEnum));

      const formatData: any = {
        bankDirectoryId: data.bankDirectoryId,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        accountType: data.accountType,
        linkedChartAccountId: data.linkedChartAccountId,
        isActive: data.isActive,
        updatedById: userId,
      };

      if (data.currencyCode && currenciesCode.length) {
        formatData.currencyCode = currenciesCode[0].code;
      }

      if (data.openingDate) {
        formatData.openingDate = new Date(data.openingDate)
          .toISOString()
          .split('T')[0];
      }

      const [updatedBankAccount] = await tx
        .update(schema.bankAccounts)
        .set(formatData)
        .where(
          and(
            eq(schema.bankAccounts.id, id),
            eq(schema.bankAccounts.tenantId, tenantId),
          ),
        )
        .returning();

      // Si se solicita generar el asiento de apertura y no se ha generado antes
      if (
        data.openingEntryPosted &&
        !existing.openingEntryPosted &&
        data.currentBalance &&
        data.currentBalance > 0
      ) {
        if (!data.ruleAccountId) {
          throw new BadRequestException(
            'Debe seleccionar una regla contable para generar el asiento de apertura.',
          );
        }

        //revisar el asiento contable aqui
        // await this._createOpeningEntry(
        //   tx,
        //   userId,
        //   updatedBankAccount,
        //   data.currentBalance,
        //   data.accountingRuleId,
        //   data.openingDate
        //     ? new Date(data.openingDate).toISOString()
        //     : undefined,
        // );

        // await tx
        //   .update(schema.bankAccounts)
        //   .set({ openingEntryPosted: true })
        //   .where(eq(schema.bankAccounts.id, id));
      }

      return updatedBankAccount;
    });
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.findOne(id, tenantId);

    if (!existing) {
      throw new NotFoundException(`Bank Account with ID ${id} not found`);
    }

    await this.drizzle
      .delete(schema.bankAccounts)
      .where(
        and(
          eq(schema.bankAccounts.id, id),
          eq(schema.bankAccounts.tenantId, tenantId),
        ),
      );

    return { message: 'Bank Account deleted successfully' };
  }

  async generateOpeningEntry(
    id: string,
    userId: string,
    currentBalance: number,
    accountingRuleId: string,
    openingDate: string,
    tenantId: string,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(schema.bankAccounts)
        .where(eq(schema.bankAccounts.id, id));

      if (!existing) {
        throw new NotFoundException(`Bank Account with ID ${id} not found`);
      }

      if (existing.openingEntryPosted) {
        throw new BadRequestException(
          'El asiento de apertura ya fue generado para esta cuenta.',
        );
      }

      if (!currentBalance || currentBalance <= 0) {
        throw new BadRequestException(
          'El saldo inicial debe ser mayor a cero.',
        );
      }

      if (!accountingRuleId) {
        throw new BadRequestException(
          'Debe seleccionar una regla contable para generar el asiento de apertura.',
        );
      }

      if (!openingDate) {
        throw new BadRequestException(
          'Debe seleccionar una fecha para el asiento de apertura.',
        );
      }

      //revisar el asiento contable aqui
      // await this._createOpeningEntry(
      //   tx,
      //   userId,
      //   existing,
      //   currentBalance,
      //   accountingRuleId,
      //   openingDate,
      // );

      await tx
        .update(schema.bankAccounts)
        .set({
          openingEntryPosted: true,
          currentBalance: String(currentBalance),
          openingDate: openingDate,
          ruleAccountId: accountingRuleId,
        })
        .where(eq(schema.bankAccounts.id, id));

      return { message: 'Asiento de apertura generado exitosamente' };
    });
  }
}
