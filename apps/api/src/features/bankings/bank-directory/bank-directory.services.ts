import { PaginationDto } from '@/common/dto/pagination.dto';
import { bankDirectory } from '@/database/schema/tables';
import { BankDirectory } from '@/database/types/treasury';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/schema';
import { CreateBankDirectoryDto } from './dto/bank-directory.schema';
import { UpdateBankDirectoryDto } from './dto/update-bank-directory.dto';

@Injectable()
export class BankDirectoryService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(): Promise<BankDirectory[]> {
    return await this.drizzle.query.bankDirectory.findMany();
  }

  async findOne(id: string): Promise<BankDirectory> {
    const [result] = await this.drizzle
      .select()
      .from(bankDirectory)
      .where(eq(bankDirectory.id, id));

    return result as BankDirectory;
  }

  async findAllByPagination(
    paginationDto: PaginationDto,
  ): Promise<{ data: BankDirectory[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
    } = paginationDto || {};
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [];
    if (search) {
      conditions.push(ilike(bankDirectory.name, `%${search}%`));
    }
    const whereCondition = and(...conditions);

    const orderBy =
      sortOrder === 'asc'
        ? sql`${bankDirectory[sortBy as keyof typeof bankDirectory]} asc`
        : sql`${bankDirectory[sortBy as keyof typeof bankDirectory]} desc`;

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(bankDirectory)
      .where(whereCondition);

    const totalCount = Number(totalCountResult[0].count);
    const data = await this.drizzle
      .select()
      .from(bankDirectory)
      .where(whereCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      data: data as BankDirectory[],
      meta: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async create(userId: string, data: CreateBankDirectoryDto) {
    const [bank] = await this.drizzle
      .select()
      .from(bankDirectory)
      .where(eq(bankDirectory.code, data.code));

    if (bank) {
      throw new HttpException(
        'Bank directory already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    const [result] = await this.drizzle
      .insert(bankDirectory)
      .values({ ...data, createdById: userId })
      .returning();

    return result;
  }

  async update(
    userId: string,
    id: string,
    data: UpdateBankDirectoryDto,
  ): Promise<BankDirectory> {
    await this.findOne(id);

    const [result] = await this.drizzle
      .update(bankDirectory)
      .set({
        ...data,
        updatedById: userId,
      })
      .where(eq(bankDirectory.id, id))
      .returning();

    return result as BankDirectory;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.drizzle
      .delete(bankDirectory)
      .where(and(eq(bankDirectory.id, id)));

    return { message: 'Bank directory deleted successfully' };
  }
}
