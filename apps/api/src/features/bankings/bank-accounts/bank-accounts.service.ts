import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { currencies } from '@/database/schema';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { CreateBankAccountDto } from './dto/bank-accounts.schema';
import { FilterBankAccountDto } from './dto/filter-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Injectable()
export class BankAccountsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(tenantId: string) {
    return await this.db
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
    const [row] = await this.db
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
        currentBalance: schema.bankAccounts.currentBalance,
        lastStatementBalance: schema.bankAccounts.lastStatementBalance,
        lastStatementDate: schema.bankAccounts.lastStatementDate,
        linkedChartAccountId: schema.bankAccounts.linkedChartAccountId,
        isActive: schema.bankAccounts.isActive,
        openingEntryPosted: schema.bankAccounts.openingEntryPosted,
        ruleAccountId: schema.bankAccounts.ruleAccountId,
        createdAt: schema.bankAccounts.createdAt,
        updatedAt: schema.bankAccounts.updatedAt,
      })
      .from(schema.bankAccounts)
      .leftJoin(
        schema.bankDirectory,
        eq(schema.bankDirectory.id, schema.bankAccounts.bankDirectoryId),
      )
      .where(
        and(
          eq(schema.bankAccounts.id, id),
          eq(schema.bankAccounts.tenantId, tenantId),
        ),
      );

    if (!row) {
      throw new NotFoundException(`Bank Account with ID ${id} not found`);
    }

    return row;
  }

  async findAllByPagination(
    tenantId: string,
    filterBankAccountDto?: FilterBankAccountDto,
  ) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      accountType,
      currencyCode,
      sortOrder = 'asc',
      sortBy = 'accountNumber',
    } = filterBankAccountDto || {};

    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [
      eq(schema.bankAccounts.tenantId, tenantId),
    ];

    if (search) {
      conditions.push(
        or(
          ilike(schema.bankAccounts.accountNumber, `%${search}%`),
          ilike(schema.bankAccounts.accountName, `%${search}%`),
        )!,
      );
    }

    if (accountType) {
      conditions.push(eq(schema.bankAccounts.accountType, accountType as any));
    }

    if (currencyCode) {
      conditions.push(
        eq(schema.bankAccounts.currencyCode, currencyCode as any),
      );
    }

    if (status) {
      const isActive = status === 'ACTIVE';
      conditions.push(eq(schema.bankAccounts.isActive, isActive));
    }

    const whereClause = and(...conditions);

    const sortColumn =
      sortBy === 'accountName'
        ? schema.bankAccounts.accountName
        : sortBy === 'accountType'
          ? schema.bankAccounts.accountType
          : sortBy === 'currencyCode'
            ? schema.bankAccounts.currencyCode
            : sortBy === 'openingDate'
              ? schema.bankAccounts.openingDate
              : sortBy === 'createdAt'
                ? schema.bankAccounts.createdAt
                : schema.bankAccounts.accountNumber;

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.bankAccounts)
      .where(whereClause);

    const totalCount = Number(totalResult.count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
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
        currentBalance: schema.bankAccounts.currentBalance,
        lastStatementBalance: schema.bankAccounts.lastStatementBalance,
        lastStatementDate: schema.bankAccounts.lastStatementDate,
        linkedChartAccountId: schema.bankAccounts.linkedChartAccountId,
        isActive: schema.bankAccounts.isActive,
        openingEntryPosted: schema.bankAccounts.openingEntryPosted,
        ruleAccountId: schema.bankAccounts.ruleAccountId,
        createdAt: schema.bankAccounts.createdAt,
        updatedAt: schema.bankAccounts.updatedAt,
      })
      .from(schema.bankAccounts)
      .leftJoin(
        schema.bankDirectory,
        eq(schema.bankDirectory.id, schema.bankAccounts.bankDirectoryId),
      )
      .where(whereClause)
      .orderBy(
        sortOrder === 'asc' ? sql`${sortColumn} asc` : sql`${sortColumn} desc`,
      )
      .limit(limit)
      .offset(offset);

    const transformData = data.map((item) => ({
      ...item,
      accountName: item.accountName ?? undefined,
      currencyCode: item.currencyCode as string,
      openingDate: item.openingDate ? new Date(item.openingDate) : undefined,
      currentBalance: item.currentBalance
        ? Number(item.currentBalance)
        : undefined,
      lastStatementBalance: item.lastStatementBalance
        ? Number(item.lastStatementBalance)
        : undefined,
      lastStatementDate: item.lastStatementDate
        ? new Date(item.lastStatementDate)
        : undefined,
    }));

    return {
      data: transformData,
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      },
    };
  }

  async create(userId: string, tenantId: string, data: CreateBankAccountDto) {
    const result = await this.db.transaction(async (tx) => {
      const [existingAccount] = await tx
        .select()
        .from(schema.bankAccounts)
        .where(
          and(
            eq(schema.bankAccounts.accountNumber, data.accountNumber),
            eq(schema.bankAccounts.tenantId, tenantId),
          ),
        );

      if (existingAccount) {
        throw new BadRequestException(
          `La cuenta bancaria con número ${data.accountNumber} ya existe`,
        );
      }

      const [currencyRecord] = await tx
        .select()
        .from(currencies)
        .where(eq(currencies.code, data.currencyCode as 'VES' | 'USD' | 'EUR'));

      if (!currencyRecord) {
        throw new BadRequestException(
          `No se encontró la moneda con código ${data.currencyCode}`,
        );
      }

      const [newBankAccount] = await tx
        .insert(schema.bankAccounts)
        .values({
          tenantId,
          bankDirectoryId: data.bankDirectoryId,
          accountNumber: data.accountNumber,
          accountName: data.accountName ?? null,
          accountType: data.accountType as any,
          currencyCode: currencyRecord.code as any,
          openingDate: data.openingDate
            ? new Date(data.openingDate).toISOString().split('T')[0]
            : null,
          linkedChartAccountId: data.linkedChartAccountId ?? null,
          currentBalance: data.currentBalance
            ? String(data.currentBalance)
            : '0.00',
          isActive: data.isActive ?? true,
          openingEntryPosted: false,
          createdById: userId,
        })
        .returning();

      return newBankAccount;
    });

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'INSERT',
        tableName: 'bank_accounts',
        recordId: result.id,
        description: `Cuenta bancaria creada: ${result.accountNumber}`,
        area: 'Treasury',
        newData: result,
        tenantId,
      }),
    );

    return result;
  }

  async update(
    id: string,
    userId: string,
    data: UpdateBankAccountDto,
    tenantId: string,
  ) {
    const result = await this.db.transaction(async (tx) => {
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

      const formatData: any = {
        updatedById: userId,
      };

      if (data.bankDirectoryId !== undefined)
        formatData.bankDirectoryId = data.bankDirectoryId;
      if (data.accountNumber !== undefined)
        formatData.accountNumber = data.accountNumber;
      if (data.accountName !== undefined)
        formatData.accountName = data.accountName;
      if (data.accountType !== undefined)
        formatData.accountType = data.accountType;
      if (data.linkedChartAccountId !== undefined)
        formatData.linkedChartAccountId = data.linkedChartAccountId;
      if (data.isActive !== undefined) formatData.isActive = data.isActive;
      if (data.currentBalance !== undefined)
        formatData.currentBalance = String(data.currentBalance);

      if (data.currencyCode) {
        const [currencyRecord] = await tx
          .select()
          .from(currencies)
          .where(
            eq(currencies.code, data.currencyCode as 'VES' | 'USD' | 'EUR'),
          );

        if (currencyRecord) {
          formatData.currencyCode = currencyRecord.code;
        }
      }

      if (data.openingDate) {
        formatData.openingDate = new Date(data.openingDate)
          .toISOString()
          .split('T')[0];
      }

      if (data.lastStatementDate) {
        formatData.lastStatementDate = new Date(data.lastStatementDate)
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

      return { updatedBankAccount, previousData: existing };
    });

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'bank_accounts',
        recordId: id,
        description: `Cuenta bancaria actualizada: ${result.updatedBankAccount.accountNumber}`,
        area: 'Treasury',
        newData: result.updatedBankAccount,
        previousData: result.previousData,
        tenantId,
      }),
    );

    return result.updatedBankAccount;
  }

  async remove(id: string, userId: string, tenantId: string) {
    const account = await this.findOne(id, tenantId);

    const [movement] = await this.db
      .select({ id: schema.bankTransactions.id })
      .from(schema.bankTransactions)
      .where(
        and(
          eq(schema.bankTransactions.bankAccountId, id),
          eq(schema.bankTransactions.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (movement) {
      throw new BadRequestException(
        'No se puede eliminar una cuenta bancaria que tiene movimientos bancarios asociados.',
      );
    }

    await this.db
      .delete(schema.bankAccounts)
      .where(
        and(
          eq(schema.bankAccounts.id, id),
          eq(schema.bankAccounts.tenantId, tenantId),
        ),
      );

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'DELETE',
        tableName: 'bank_accounts',
        recordId: id,
        description: `Cuenta bancaria eliminada: ${account.accountNumber}`,
        area: 'Treasury',
        previousData: account,
        tenantId,
      }),
    );

    return { message: 'Cuenta bancaria eliminada correctamente' };
  }

  async getBalancesByCurrency(tenantId: string) {
    const rows = await this.db
      .select({
        currencyCode: schema.bankAccounts.currencyCode,
        bookBalance: sql<number>`COALESCE(SUM(${schema.bankAccounts.currentBalance}), 0)`,
        statementBalance: sql<number>`COALESCE(SUM(${schema.bankAccounts.lastStatementBalance}), 0)`,
      })
      .from(schema.bankAccounts)
      .where(
        and(
          eq(schema.bankAccounts.tenantId, tenantId),
          eq(schema.bankAccounts.isActive, true),
        ),
      )
      .groupBy(schema.bankAccounts.currencyCode);

    return rows.map((row) => ({
      currencyCode: row.currencyCode as string,
      bookBalance: Number(row.bookBalance),
      statementBalance: Number(row.statementBalance),
      difference: Number(row.bookBalance) - Number(row.statementBalance),
    }));
  }

}
