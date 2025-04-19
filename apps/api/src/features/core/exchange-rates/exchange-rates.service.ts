import { PaginationDto } from '@/common/dto/pagination.dto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateExchangeRatesDto } from './dto/create-exchange-rates.dto';
import { UpdateExchangeRatesDto } from './dto/update-exchange-rates.dto';
import { ExchangeRates } from './entities/exchange-rates.entity';

@Injectable()
export class ExchangeRatesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findCurrenciesByCode(date: Date) {
    return this.drizzle
      .select()
      .from(schema.exchangeRates)
      .where(eq(schema.exchangeRates.date, date.toISOString().split('T')[0]));
  }

  async create(
    userId: string,
    createExchangeRatesDto: CreateExchangeRatesDto,
  ): Promise<ExchangeRates> {
    const find = await this.findCurrenciesByCode(createExchangeRatesDto.date);
    if (find.length !== 0) {
      throw new NotFoundException(`Rate for date already exists`);
    }

    // Convert Date objects to string format for database insertion
    const ExchangeRatesData = {
      ...createExchangeRatesDto,
      date: createExchangeRatesDto.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
      rate: createExchangeRatesDto.rate.toString(),
      createdById: parseInt(userId),
    };

    const exchangeRate = await this.drizzle
      .insert(schema.exchangeRates)
      .values(ExchangeRatesData)
      .returning();

    // Convert string date back to Date object before returning
    return {
      ...exchangeRate[0],
      rate: Number(exchangeRate[0].rate),
      date: new Date(exchangeRate[0].date),
    } as ExchangeRates;
  }

  async findOne(id: number): Promise<ExchangeRates> {
    const exchange = await this.drizzle
      .select()
      .from(schema.exchangeRates)
      .where(eq(schema.exchangeRates.id, id));

    return {
      ...exchange[0],
      rate: Number(exchange[0].rate),
      date: new Date(exchange[0].date),
    } as ExchangeRates;
  }

  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<{ data: ExchangeRates[]; meta: any }> {
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
      searchCondition = ilike(schema.exchangeRates.date, `%${search}%`);
    }

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${schema.exchangeRates[sortBy as keyof typeof schema.exchangeRates]} asc`
        : sql`${schema.exchangeRates[sortBy as keyof typeof schema.exchangeRates]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.exchangeRates)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.drizzle
      .select()
      .from(schema.exchangeRates)
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

    return {
      data: data.map((item) => ({
        ...item,
        rate: Number(item.rate),
        date: new Date(item.date),
      })) as ExchangeRates[],
      meta,
    };
  }

  async update(
    id: number,
    userId: string,
    updateExchangeRatesDto: UpdateExchangeRatesDto,
  ): Promise<ExchangeRates> {
    const existing = await this.findOne(id);

    if (existing) {
      throw new NotFoundException(
        `Update Exchange Rate with ID ${id} not found`,
      );
    }

    const result = await this.drizzle
      .update(schema.exchangeRates)
      .set({
        ...updateExchangeRatesDto,
        date: updateExchangeRatesDto.date?.toISOString().split('T')[0],
        rate: updateExchangeRatesDto.rate?.toString(),
        updatedById: parseInt(userId),
      })
      .where(eq(schema.currencies.id, id))
      .returning();

    return {
      ...result[0],
      // Rate property needs to be accessed from exchangeRates schema
      rate: Number(result[0].rate),
      date: new Date(result[0].date),
    } as unknown as ExchangeRates;
  }

  async remove(id: number) {
    const existing = await this.findOne(id);

    if (!existing) {
      throw new NotFoundException(
        `Delete Exchange Rate with ID ${id} not found`,
      );
    }

    await this.drizzle
      .delete(schema.exchangeRates)
      .where(eq(schema.exchangeRates.id, id));

    return { message: 'Exchange Rate deleted successfully' };
  }
}
