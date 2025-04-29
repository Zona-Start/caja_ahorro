import { currencies } from '@/database';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema/banking';
import { CurrencyCodeEnum } from '@/types/enum';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { FilterBankAccountDto } from './dto/filter-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Injectable()
export class BankAccountsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return await this.drizzle
      .select({
        id: schema.bankAccounts.id,
        companyId: schema.bankAccounts.companyId,
        bankDirectoryId: schema.bankAccounts.bankDirectoryId,
        accountNumber: schema.bankAccounts.accountNumber,
        accountName: schema.bankAccounts.accountName,
        accountType: schema.bankAccounts.accountType,
        currencyCode: schema.bankAccounts.currencyCode,
        openingDate: schema.bankAccounts.openingDate,
        currentBalance: schema.bankAccounts.currentBalance,
        lastStatementBalance: schema.bankAccounts.lastStatementBalance,
        lastStatementDate: schema.bankAccounts.lastStatementDate,
        linkedChartAccountId: schema.bankAccounts.linkedChartAccountId,
        isActive: schema.bankAccounts.isActive,
      })
      .from(schema.bankAccounts);
  }

  async findOne(id: number) {
    const result = await this.drizzle
      .select({
        id: schema.bankAccounts.id,
        companyId: schema.bankAccounts.companyId,
        bankDirectoryId: schema.bankAccounts.bankDirectoryId,
        accountNumber: schema.bankAccounts.accountNumber,
        accountName: schema.bankAccounts.accountName,
        accountType: schema.bankAccounts.accountType,
        currencyCode: schema.bankAccounts.currencyCode,
        openingDate: schema.bankAccounts.openingDate,
        currentBalance: schema.bankAccounts.currentBalance,
        lastStatementBalance: schema.bankAccounts.lastStatementBalance,
        lastStatementDate: schema.bankAccounts.lastStatementDate,
        linkedChartAccountId: schema.bankAccounts.linkedChartAccountId,
        isActive: schema.bankAccounts.isActive,
      })
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

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build search condition
    let searchCondition: SQL<unknown> | undefined;
    if (search) {
      searchCondition = ilike(schema.bankAccounts.accountNumber, `%${search}%`);
    }

    // Agregué una condición para filtrar por grupo si el parámetro `group` está presente.
    if (accountType) {
      console.log('entre', accountType);

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

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${schema.bankAccounts[sortBy as keyof typeof schema.bankAccounts]} asc`
        : sql`${schema.bankAccounts[sortBy as keyof typeof schema.bankAccounts]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.bankAccounts)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
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
        currentBalance: schema.bankAccounts.currentBalance,
        lastStatementBalance: schema.bankAccounts.lastStatementBalance,
        lastStatementDate: schema.bankAccounts.lastStatementDate,
        linkedChartAccountId: schema.bankAccounts.linkedChartAccountId,
        isActive: schema.bankAccounts.isActive,
      })
      .from(schema.bankAccounts)
      .where(searchCondition)
      .leftJoin(
        schema.bankDirectory,
        eq(schema.bankDirectory.id, schema.bankAccounts.bankDirectoryId),
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
    const existingAccount = await this.drizzle
      .select()
      .from(schema.bankAccounts)
      .where(eq(schema.bankAccounts.accountNumber, data.accountNumber));

    if (existingAccount.length) {
      throw new Error(
        `Bank Account with account number ${data.accountNumber} already exists`,
      );
    }
    const currenciesCode = await this.drizzle
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
    };

    const result = await this.drizzle
      .insert(schema.bankAccounts)
      .values(formatData)
      .returning({
        id: schema.bankAccounts.id,
        companyId: schema.bankAccounts.companyId,
        bankDirectoryId: schema.bankAccounts.bankDirectoryId,
        accountNumber: schema.bankAccounts.accountNumber,
        accountName: schema.bankAccounts.accountName,
        accountType: schema.bankAccounts.accountType,
        currencyCode: schema.bankAccounts.currencyCode,
        openingDate: schema.bankAccounts.openingDate,
        currentBalance: schema.bankAccounts.currentBalance,
        lastStatementBalance: schema.bankAccounts.lastStatementBalance,
        lastStatementDate: schema.bankAccounts.lastStatementDate,
        linkedChartAccountId: schema.bankAccounts.linkedChartAccountId,
        isActive: schema.bankAccounts.isActive,
      });

    return result[0];
  }

  async update(id: number, userId: number, data: UpdateBankAccountDto) {
    const existing = await this.findOne(id);

    if (!existing) {
      throw new NotFoundException(`Bank Account with ID ${id} not found`);
    }

    const currenciesCode = await this.drizzle
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
    };

    const result = await this.drizzle
      .update(schema.bankAccounts)
      .set(formatData)
      .where(eq(schema.bankAccounts.id, id))
      .returning({
        id: schema.bankAccounts.id,
        companyId: schema.bankAccounts.companyId,
        bankDirectoryId: schema.bankAccounts.bankDirectoryId,
        accountNumber: schema.bankAccounts.accountNumber,
        accountName: schema.bankAccounts.accountName,
        accountType: schema.bankAccounts.accountType,
        currencyCode: schema.bankAccounts.currencyCode,
        openingDate: schema.bankAccounts.openingDate,
        currentBalance: schema.bankAccounts.currentBalance,
        lastStatementBalance: schema.bankAccounts.lastStatementBalance,
        lastStatementDate: schema.bankAccounts.lastStatementDate,
        linkedChartAccountId: schema.bankAccounts.linkedChartAccountId,
        isActive: schema.bankAccounts.isActive,
      });

    return result[0];
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
