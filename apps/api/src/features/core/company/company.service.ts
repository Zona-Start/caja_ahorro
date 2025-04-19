import { company } from '@/database/schema/core';
import { CurrencyCodeEnum } from '@/types/enum';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { BankAccounts } from './entities/bank-accounts.entity';
import { CompanyEntity } from './entities/company.entity';

@Injectable()
export class CompanyService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findSavingBank(rif: string) {
    return this.drizzle.select().from(company).where(eq(company.rif, rif));
  }

  async create(createCompanyDto: CreateCompanyDto) {
    const existingBank = await this.findSavingBank(createCompanyDto.rif);

    if (existingBank.length !== 0) {
      throw new NotFoundException(`Company found`);
    }

    const result = await this.drizzle
      .insert(company)
      .values(createCompanyDto)
      .returning();

    return result[0];
  }

  async findAll(): Promise<CompanyEntity[]> {
    const companies = await this.drizzle.select().from(company);
    return companies.map((c) => ({
      ...c,
      updatedAt: c.updatedAt || undefined,
    }));
  }

  async findOne(id: number): Promise<CompanyEntity> {
    const result = await this.drizzle
      .select()
      .from(company)
      .where(eq(company.id, id));

    if (!result.length) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return {
      ...result[0],
      updatedAt: result[0].updatedAt || undefined,
    };
  }

  async update(
    id: number,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanyEntity> {
    const existingBank = await this.findOne(id);

    if (!existingBank) {
      throw new NotFoundException(`Company not found`);
    }

    const result = await this.drizzle
      .update(company)
      .set({
        ...updateCompanyDto,
      })
      .where(eq(company.id, id))
      .returning();

    return {
      ...result[0],
      updatedAt: result[0].updatedAt || undefined,
    };
  }

  async remove(id: number) {
    const existingBank = await this.findOne(id);

    if (!existingBank) {
      throw new NotFoundException(`Company not found`);
    }

    await this.drizzle.delete(company).where(eq(company.id, id));

    return { message: 'Company deleted successfully' };
  }

  // Banks Accounts

  async findAllBankAccountsByCompanyId(
    companyId: number,
  ): Promise<BankAccounts[]> {
    const bankAccounts = await this.drizzle
      .select()
      .from(schema.bankAccounts)
      .where(eq(schema.bankAccounts.companyId, companyId));

    return bankAccounts.map((account) => ({
      ...account,
      accountName: account.accountName || undefined,
      currencyCode: account.currencyCode as CurrencyCodeEnum,
      currentBalance: account.currentBalance
        ? Number(account.currentBalance)
        : undefined,
      lastStatementBalance: account.lastStatementBalance
        ? Number(account.lastStatementBalance)
        : undefined,
      openingDate: account.openingDate
        ? new Date(account.openingDate)
        : undefined,
      lastStatementDate: account.lastStatementDate
        ? new Date(account.lastStatementDate)
        : undefined,
      updatedAt: account.updatedAt || undefined,
      createdById: account.createdById ?? undefined,
    }));
  }

  async createBankAccount(
    userId: number,
    createBankAccountDto: CreateBankAccountDto,
  ): Promise<BankAccounts> {
    const existingBank = await this.drizzle
      .select()
      .from(schema.bankAccounts)
      .where(
        eq(
          schema.bankAccounts.accountNumber,
          createBankAccountDto.accountNumber,
        ),
      );
    if (existingBank.length !== 0) {
      throw new NotFoundException(
        `Bank Accounts with account number ${createBankAccountDto.accountNumber} exist`,
      );
    }

    const result = await this.drizzle
      .insert(schema.bankAccounts)
      .values({
        ...createBankAccountDto,
        currentBalance: createBankAccountDto.currentBalance?.toString(),
        lastStatementBalance:
          createBankAccountDto.lastStatementBalance?.toString(),
        openingDate: createBankAccountDto.openingDate?.toISOString(),
        lastStatementDate:
          createBankAccountDto.lastStatementDate?.toISOString(),
        createdById: userId,
      })
      .returning();

    // Transform null values to undefined for accountName and other nullable fields
    return {
      ...result[0],
      accountName: result[0].accountName || undefined,
      currentBalance: result[0].currentBalance
        ? Number(result[0].currentBalance)
        : undefined,
      lastStatementBalance: result[0].lastStatementBalance
        ? Number(result[0].lastStatementBalance)
        : undefined,
      openingDate: result[0].openingDate
        ? new Date(result[0].openingDate)
        : undefined,
      lastStatementDate: result[0].lastStatementDate
        ? new Date(result[0].lastStatementDate)
        : undefined,
    } as BankAccounts;
  }

  async updateBankAccount(
    userId: number,
    id: number,
    updateBankAccountDto: UpdateBankAccountDto,
  ): Promise<BankAccounts> {
    const existingBank = await this.drizzle
      .select()
      .from(schema.bankAccounts)
      .where(
        eq(
          schema.bankAccounts.accountNumber,
          updateBankAccountDto.accountNumber!,
        ),
      );

    if (existingBank.length !== 0) {
      throw new NotFoundException(
        `Bank Accounts with account number ${updateBankAccountDto.accountNumber} exist`,
      );
    }

    const result = await this.drizzle
      .update(schema.bankAccounts)
      .set({
        ...updateBankAccountDto,
        currentBalance: updateBankAccountDto.currentBalance?.toString(),
        lastStatementBalance:
          updateBankAccountDto.lastStatementBalance?.toString(),
        openingDate: updateBankAccountDto.openingDate?.toISOString(),
        lastStatementDate:
          updateBankAccountDto.lastStatementDate?.toISOString(),
        updatedById: userId,
      })
      .where(eq(schema.bankAccounts.id, id))
      .returning();

    // Transform null values to undefined for accountName and other nullable fields
    return {
      ...result[0],
      accountName: result[0].accountName || undefined,
      currentBalance: result[0].currentBalance
        ? Number(result[0].currentBalance)
        : undefined,
      lastStatementBalance: result[0].lastStatementBalance
        ? Number(result[0].lastStatementBalance)
        : undefined,
      openingDate: result[0].openingDate
        ? new Date(result[0].openingDate)
        : undefined,
      lastStatementDate: result[0].lastStatementDate
        ? new Date(result[0].lastStatementDate)
        : undefined,
    } as BankAccounts;
  }

  async removeBankAccount(id: number) {
    await this.drizzle
      .update(schema.bankAccounts)
      .set({
        is_active: false,
      })
      .where(eq(schema.bankAccounts.id, id));

    return { message: 'Bank Account by company deleted successfully' };
  }
}
