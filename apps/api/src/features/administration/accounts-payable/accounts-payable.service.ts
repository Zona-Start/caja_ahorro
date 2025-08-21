import { accountsPayable } from '@/database/schema/administration';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateAccountPayableDto } from './dto/create-account-payable.dto';
import { FilterAccountPayableDto } from './dto/filter-account-payable.dto';
import { UpdateAccountPayableDto } from './dto/update-account-payable.dto';

@Injectable()
export class AccountsPayableService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(
    userId: number,
    data: CreateAccountPayableDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;
    const exist = await db.query.accountsPayable.findFirst({
      where: eq(accountsPayable.supplierInvoiceId, data.supplierInvoiceId),
    });

    if (exist) {
      throw new BadRequestException(
        'Account payable for this invoice already exists',
      );
    }

    const newAccountPayable = await db
      .insert(accountsPayable)
      .values({
        ...data,
        originalAmount: data.originalAmount.toString(),
        paidAmount: data.paidAmount?.toString() || '0.00',
        remainingAmount: data.remainingAmount.toString(),
        createdById: userId,
      })
      .returning();

    return newAccountPayable[0];
  }

  async findAll(paginationDto: FilterAccountPayableDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      supplierInvoiceId,
      status,
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];
    if (search) {
      searchConditions.push(ilike(accountsPayable.observations, `%${search}%`));
    }
    if (supplierInvoiceId) {
      searchConditions.push(
        eq(accountsPayable.supplierInvoiceId, supplierInvoiceId),
      );
    }
    if (status) {
      searchConditions.push(eq(accountsPayable.status, status as any));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${accountsPayable[sortBy as keyof typeof accountsPayable]} asc`
        : sql`${accountsPayable[sortBy as keyof typeof accountsPayable]} desc`;

    const data = await this.drizzle.query.accountsPayable.findMany({
      where: searchCondition,
      limit: limit,
      offset: offset,
      orderBy: orderBy,
      with: {
        supplierInvoice: true,
      },
    });

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(accountsPayable)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const meta = {
      page: Number(page),
      limit: Number(limit),
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return { data, meta };
  }

  async findOne(id: number) {
    const data = await this.drizzle.query.accountsPayable.findFirst({
      where: eq(accountsPayable.id, id),
      with: {
        supplierInvoice: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Account payable not found');
    }

    return data;
  }

  async update(userId: number, id: number, data: UpdateAccountPayableDto) {
    const exist = await this.drizzle.query.accountsPayable.findFirst({
      where: eq(accountsPayable.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Account payable not found');
    }

    const updatedAccountPayable = await this.drizzle
      .update(accountsPayable)
      .set({
        ...data,
        originalAmount: data.originalAmount?.toString(),
        paidAmount: data.paidAmount?.toString(),
        remainingAmount: data.remainingAmount?.toString(),
        updatedById: userId,
      })
      .where(eq(accountsPayable.id, id))
      .returning();

    return updatedAccountPayable[0];
  }

  async remove(id: number) {
    const exist = await this.drizzle.query.accountsPayable.findFirst({
      where: eq(accountsPayable.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Account payable not found');
    }

    await this.drizzle
      .delete(accountsPayable)
      .where(eq(accountsPayable.id, id));

    return { message: 'Account payable removed successfully' };
  }
}
