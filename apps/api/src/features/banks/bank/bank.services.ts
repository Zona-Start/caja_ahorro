import { PaginationDto } from '@/common/dto/pagination.dto';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { banks } from '../../../database/schema/bank';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { Bank } from './entities/bank.entity';

@Injectable()
export class BankService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.drizzle.select().from(banks);
  }

  async findOne(id: string) {
    const [result] = await this.drizzle
      .select()
      .from(banks)
      .where(eq(banks.id, parseInt(id)));

    return result;
  }

  async findByCode(code: string) {
    const [result] = await this.drizzle
      .select()
      .from(banks)
      .where(eq(banks.code, code));

    return result;
  }

  async findAllByPagination(
    paginationDto?: PaginationDto,
  ): Promise<{ data: Bank[]; meta: any }> {
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
      searchCondition = ilike(banks.name, `%${search}%`);
    }
    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${banks[sortBy as keyof typeof banks]} asc`
        : sql`${banks[sortBy as keyof typeof banks]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(banks)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.drizzle
      .select({
        id: banks.id,
        code: banks.code,
        name: banks.name,
      })
      .from(banks)
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

    return { data, meta };
  }

  async create(data: CreateBankDto) {
    const bank = await this.drizzle
      .select()
      .from(banks)
      .where(eq(banks.code, data.code));
    if (bank.length !== 0) {
      throw new HttpException('Banks  exist', HttpStatus.BAD_REQUEST);
    }

    const [result] = await this.drizzle.insert(banks).values(data).returning();

    return result;
  }

  async update(id: string, data: UpdateBankDto) {
    const bank = await this.drizzle
      .select()
      .from(banks)
      .where(eq(banks.id, parseInt(id)));
    if (bank.length === 0) {
      throw new HttpException('Banks  not found', HttpStatus.BAD_REQUEST);
    }

    const [result] = await this.drizzle
      .update(banks)
      .set(data)
      .where(eq(banks.id, parseInt(id)))
      .returning();

    return result;
  }

  async remove(id: string) {
    const bank = await this.drizzle
      .select()
      .from(banks)
      .where(eq(banks.id, parseInt(id)));
    if (bank.length === 0) {
      throw new HttpException('Banks not found', HttpStatus.BAD_REQUEST);
    }
    await this.drizzle
      .delete(banks)
      .where(eq(banks.id, parseInt(id)))
      .returning();

    return { message: 'Banks deleted successfully' };
  }
}
