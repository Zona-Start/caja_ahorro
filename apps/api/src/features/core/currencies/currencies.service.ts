import { PaginationDto } from '@/common/dto/pagination.dto';
import { CurrencyCodeEnum } from '@/types/enum';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateCurrenciesDto } from './dto/create-currencies.dto';
import { UpdateCurrenciesDto } from './dto/update-currencies.dto';
import { Currencies } from './entities/currencies.entity';

@Injectable()
export class CurrenciesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findCurrenciesByCode(code: CurrencyCodeEnum) {
    return this.drizzle
      .select()
      .from(schema.currencies)
      .where(eq(schema.currencies.code, code));
  }

  async create(
    userId: string,
    createCurrenciesDto: CreateCurrenciesDto,
  ): Promise<Currencies> {
    const find = await this.findCurrenciesByCode(createCurrenciesDto.code);
    if (find.length !== 0) {
      throw new NotFoundException(`Currencie already exists`);
    }

    // Convert Date objects to string format for database insertion
    const CurrencieData = {
      ...createCurrenciesDto,
      createdById: parseInt(userId),
    };

    const cureencies = await this.drizzle
      .insert(schema.currencies)
      .values(CurrencieData)
      .returning();

    return cureencies[0] as Currencies;
  }

  async findOne(id: number): Promise<Currencies> {
    const currencie = await this.drizzle
      .select({
        id: schema.currencies.id,
        code: schema.currencies.code,
        name: schema.currencies.name,
        symbol: schema.currencies.symbol,
        decimalPlaces: schema.currencies.decimalPlaces,
        isActive: schema.currencies.isActive,
      })
      .from(schema.currencies)
      .where(
        and(eq(schema.currencies.id, id), eq(schema.currencies.isActive, true)),
      );

    return currencie[0] as Currencies;
  }

  async findAllConfig(): Promise<{ data: Currencies[] }> {
    // Get paginated data
    const data = await this.drizzle
      .select({
        id: schema.currencies.id,
        code: schema.currencies.code,
        name: schema.currencies.name,
        symbol: schema.currencies.symbol,
        decimalPlaces: schema.currencies.decimalPlaces,
        isActive: schema.currencies.isActive,
      })
      .from(schema.currencies);
    return { data: data as Currencies[] };
  }

  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<{ data: Currencies[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
    } = paginationDto || {};

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build search condition
    let searchCondition: SQL<unknown> | undefined;
    if (search) {
      searchCondition = ilike(schema.currencies.name, `%${search}%`);
    }

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${schema.currencies[sortBy as keyof typeof schema.currencies]} asc`
        : sql`${schema.currencies[sortBy as keyof typeof schema.currencies]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.currencies)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.drizzle
      .select({
        id: schema.currencies.id,
        code: schema.currencies.code,
        name: schema.currencies.name,
        symbol: schema.currencies.symbol,
        decimalPlaces: schema.currencies.decimalPlaces,
        isActive: schema.currencies.isActive,
      })
      .from(schema.currencies)
      .where(searchCondition)
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

    return { data: data as Currencies[], meta };
  }

  async update(
    id: number,
    userId: string,
    updateCurrenciesDto: UpdateCurrenciesDto,
  ): Promise<Currencies> {
    const existing = await this.findOne(id);

    if (existing) {
      throw new NotFoundException(`Update Currencie with ID ${id} not found`);
    }

    const result = await this.drizzle
      .update(schema.currencies)
      .set({
        ...updateCurrenciesDto,
      })
      .where(eq(schema.currencies.id, id))
      .returning();

    return result[0] as Currencies;
  }

  async remove(id: number) {
    const existing = await this.findOne(id);

    if (!existing) {
      throw new NotFoundException(`Delete Currencie with ID ${id} not found`);
    }

    if (existing.code === CurrencyCodeEnum.VES) {
      throw new NotFoundException(`Delete Currencie with Bolivar not allowed`);
    }

    await this.drizzle
      .delete(schema.currencies)
      .where(eq(schema.currencies.id, id));

    return { message: 'Currencie deleted successfully' };
  }
}
