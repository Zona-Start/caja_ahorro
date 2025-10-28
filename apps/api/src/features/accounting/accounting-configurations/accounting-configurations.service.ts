import { accountingConfiguration } from '@/database/schema/tables';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { UpdateAccountingConfigurationDto } from './dto/update-accounting-configuration.dto';
import { CreateAccountingConfigurationDto } from './dto/create-accounting-configuration.dto';
import { FilterAccountingConfigurationDto } from './dto/filter-accounting-configuration.dto';
import { AccountingConfiguration } from './entities/accounting-configuration.entity';

@Injectable()
export class AccountingConfigurationsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(userdId: number, createAccountingConfigurationDto: CreateAccountingConfigurationDto) {
    const exists = await this.drizzle
      .select()
      .from(accountingConfiguration)
      .where(
        and(
          eq(accountingConfiguration.companyId, createAccountingConfigurationDto.companyId),
          eq(accountingConfiguration.operationType, createAccountingConfigurationDto.operationType),
        ),
      );

    if (exists.length > 0) {
      throw new NotFoundException(`Accounting Configuration already exists`);
    }
    const result = await this.drizzle
      .insert(accountingConfiguration)
      .values({
        ...createAccountingConfigurationDto,
        createdById: userdId,
      })
      .returning();

    return result[0];
  }

  async findAll() {
    return await this.drizzle.select().from(accountingConfiguration);
  }

  async findAllByPagination(
    paginationDto?: FilterAccountingConfigurationDto,
  ): Promise<{ data: AccountingConfiguration[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];

    if (search) {
        searchConditions.push(ilike(accountingConfiguration.operationType, `%${search}%`));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${accountingConfiguration[sortBy as keyof typeof accountingConfiguration]} asc`
        : sql`${accountingConfiguration[sortBy as keyof typeof accountingConfiguration]} desc`;

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(accountingConfiguration)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.drizzle
      .select()
      .from(accountingConfiguration)
      .where(searchCondition)
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

    return {
      data: data as AccountingConfiguration[],
      meta,
    };
  }

  async findOne(id: number) {
    const result = await this.drizzle
      .select()
      .from(accountingConfiguration)
      .where(eq(accountingConfiguration.id, id));

    if (!result.length) {
      throw new NotFoundException(`Accounting Configuration with ID ${id} not found`);
    }

    return result[0];
  }

  async update(
    userdId: number,
    id: number,
    updateAccountingConfigurationDto: UpdateAccountingConfigurationDto,
  ) {
    const existing = await this.findOne(id);

    if (!existing) {
      throw new NotFoundException(
        `Accounting Configuration with ID ${id} not found`,
      );
    }

    const result = await this.drizzle
      .update(accountingConfiguration)
      .set({
        ...updateAccountingConfigurationDto,
        updatedById: userdId,
      })
      .where(eq(accountingConfiguration.id, id))
      .returning();

    return result[0];
  }

  async remove(id: number) {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException(
        `Accounting Configuration with ID ${id} not found`,
      );
    }

    await this.drizzle.delete(accountingConfiguration).where(eq(accountingConfiguration.id, id));

    return { message: 'Accounting Configuration deleted successfully' };
  }
}
