import {
  supplierInvoiceItems,
  supplierInvoices,
} from '@/database/schema/administration';
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
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';
import { FilterSupplierInvoiceDto } from './dto/filter-supplier-invoice.dto';
import { UpdateSupplierInvoiceDto } from './dto/update-supplier-invoice.dto';

@Injectable()
export class SupplierInvoicesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(userId: number, data: CreateSupplierInvoiceDto) {
    const { items, ...invoiceData } = data;

    return await this.drizzle.transaction(async (tx) => {
      const newInvoice = await tx
        .insert(supplierInvoices)
        .values({
          ...invoiceData,
          createdById: userId,
        })
        .returning();

      if (items && items.length > 0) {
        const invoiceItems = items.map((item) => ({
          ...item,
          invoiceId: newInvoice[0].id,
          createdById: userId,
        }));
        await tx.insert(supplierInvoiceItems).values(invoiceItems);
      }

      return newInvoice[0];
    });
  }

  async findAll(paginationDto: FilterSupplierInvoiceDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      supplierId,
      status,
      startDate,
      endDate,
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];
    if (search) {
      searchConditions.push(ilike(supplierInvoices.invoiceNumber, `%${search}%`));
    }
    if (supplierId) {
      searchConditions.push(eq(supplierInvoices.supplierId, supplierId));
    }
    if (status) {
      searchConditions.push(eq(supplierInvoices.status, status as any));
    }
    if (startDate) {
      searchConditions.push(sql`${supplierInvoices.invoiceDate} >= ${startDate}`);
    }
    if (endDate) {
      searchConditions.push(sql`${supplierInvoices.invoiceDate} <= ${endDate}`);
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${supplierInvoices[sortBy as keyof typeof supplierInvoices]} asc`
        : sql`${supplierInvoices[sortBy as keyof typeof supplierInvoices]} desc`;

    const data = await this.drizzle.query.supplierInvoices.findMany({
      where: searchCondition,
      limit: limit,
      offset: offset,
      orderBy: orderBy,
      with: {
        supplier: true,
        items: true,
      },
    });

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(supplierInvoices)
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
    const data = await this.drizzle.query.supplierInvoices.findFirst({
      where: eq(supplierInvoices.id, id),
      with: {
        supplier: true,
        items: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Supplier invoice not found');
    }

    return data;
  }

  async update(userId: number, id: number, data: UpdateSupplierInvoiceDto) {
    const { items, ...invoiceData } = data;

    return await this.drizzle.transaction(async (tx) => {
      const updatedInvoice = await tx
        .update(supplierInvoices)
        .set({
          ...invoiceData,
          updatedById: userId,
        })
        .where(eq(supplierInvoices.id, id))
        .returning();

      if (items) {
        await tx.delete(supplierInvoiceItems).where(eq(supplierInvoiceItems.invoiceId, id));
        const invoiceItems = items.map((item) => ({
          ...item,
          invoiceId: id,
          createdById: userId,
        }));
        await tx.insert(supplierInvoiceItems).values(invoiceItems);
      }

      return updatedInvoice[0];
    });
  }

  async remove(id: number) {
    return await this.drizzle.transaction(async (tx) => {
      await tx.delete(supplierInvoiceItems).where(eq(supplierInvoiceItems.invoiceId, id));
      await tx.delete(supplierInvoices).where(eq(supplierInvoices.id, id));
      return { message: 'Supplier invoice removed successfully' };
    });
  }
}
