import { PaginationDto } from '@/common/dto/pagination.dto';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { bankDirectory } from '../../../database/schema/banking';
import { CreateBankDirectoryDto } from './dto/create-bank-directory.dto';
import { UpdateBankDirectoryDto } from './dto/update-bank-directory.dto';
import { BankDirectory } from './entities/bank-directory.entity';

@Injectable()
export class BankDirectoryService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(): Promise<BankDirectory[]> {
    const data = await this.drizzle
      .select({
        id: bankDirectory.id,
        code: bankDirectory.code,
        name: bankDirectory.name,
        isActive: bankDirectory.isActive,
        countryCode: bankDirectory.countryCode,
      })
      .from(bankDirectory);

    return data as BankDirectory[];
  }

  async findOne(id: string): Promise<BankDirectory> {
    const [result] = await this.drizzle
      .select()
      .from(bankDirectory)
      .where(eq(bankDirectory.id, parseInt(id)));

    return result as BankDirectory;
  }

  async findByCode(code: string): Promise<BankDirectory> {
    const [result] = await this.drizzle
      .select()
      .from(bankDirectory)
      .where(eq(bankDirectory.code, code));
    return result as BankDirectory;
  }

  async findAllByPagination(
    paginationDto?: PaginationDto,
  ): Promise<{ data: BankDirectory[]; meta: any }> {
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
      searchCondition = ilike(bankDirectory.name, `%${search}%`);
    }
    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${bankDirectory[sortBy as keyof typeof bankDirectory]} asc`
        : sql`${bankDirectory[sortBy as keyof typeof bankDirectory]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(bankDirectory)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.drizzle
      .select({
        id: bankDirectory.id,
        code: bankDirectory.code,
        name: bankDirectory.name,
        isActive: bankDirectory.isActive,
        countryCode: bankDirectory.countryCode,
      })
      .from(bankDirectory)
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

    return { data: data as BankDirectory[], meta };
  }

  async create(userId: number, data: CreateBankDirectoryDto) {
    const bank = await this.drizzle
      .select()
      .from(bankDirectory)
      .where(eq(bankDirectory.code, data.code));
    if (bank.length !== 0) {
      throw new HttpException('Banks exist directory', HttpStatus.BAD_REQUEST);
    }

    const [result] = await this.drizzle
      .insert(bankDirectory)
      .values({
        ...data,
        createdById: userId,
      })
      .returning();

    return result;
  }

  async update(
    userId: number,
    id: string,
    data: UpdateBankDirectoryDto,
  ): Promise<BankDirectory> {
    const bank = await this.drizzle
      .select()
      .from(bankDirectory)
      .where(eq(bankDirectory.id, parseInt(id)));
    if (bank.length === 0) {
      throw new HttpException(
        'Bank directory  not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    const [result] = await this.drizzle
      .update(bankDirectory)
      .set({
        code: data.code,
        name: data.name,
        isActive: data.isActive === 'true' ? true : false,
        countryCode: data.countryCode,
        updatedById: userId,
      })
      .where(eq(bankDirectory.id, parseInt(id)))
      .returning();

    return <BankDirectory>{
      ...result,
      countryCode: result.countryCode || undefined,
    };
  }

  async remove(id: string) {
    const bank = await this.drizzle
      .select()
      .from(bankDirectory)
      .where(eq(bankDirectory.id, parseInt(id)));
    if (bank.length === 0) {
      throw new HttpException(
        'Bank directory not found',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.drizzle
      .delete(bankDirectory)
      .where(eq(bankDirectory.id, parseInt(id)))
      .returning();

    return { message: 'Bank directory deleted successfully' };
  }
}
