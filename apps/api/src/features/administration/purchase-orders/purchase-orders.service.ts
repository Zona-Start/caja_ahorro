import { purchaseOrderItems, purchaseOrders } from '@/database/schema/administration';
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
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { FilterPurchaseOrderDto } from './dto/filter-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(userId: number, data: CreatePurchaseOrderDto) {
    const { items, ...orderData } = data;

    return await this.drizzle.transaction(async (tx) => {
      const newOrder = await tx
        .insert(purchaseOrders)
        .values({
          ...orderData,
          createdById: userId,
        })
        .returning();

      if (items && items.length > 0) {
        const orderItems = items.map((item) => ({
          ...item,
          purchaseOrderId: newOrder[0].id,
          createdById: userId,
        }));
        await tx.insert(purchaseOrderItems).values(orderItems);
      }

      return newOrder[0];
    });
  }

  async findAll(paginationDto: FilterPurchaseOrderDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      supplierId,
      orderType,
      status,
      startDate,
      endDate,
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];
    if (search) {
      searchConditions.push(ilike(purchaseOrders.orderNumber, `%${search}%`));
    }
    if (supplierId) {
      searchConditions.push(eq(purchaseOrders.supplierId, supplierId));
    }
    if (orderType) {
      searchConditions.push(eq(purchaseOrders.orderType, orderType as any));
    }
    if (status) {
      searchConditions.push(eq(purchaseOrders.status, status as any));
    }
    if (startDate) {
      searchConditions.push(sql`${purchaseOrders.orderDate} >= ${startDate}`);
    }
    if (endDate) {
      searchConditions.push(sql`${purchaseOrders.orderDate} <= ${endDate}`);
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${purchaseOrders[sortBy as keyof typeof purchaseOrders]} asc`
        : sql`${purchaseOrders[sortBy as keyof typeof purchaseOrders]} desc`;

    const data = await this.drizzle.query.purchaseOrders.findMany({
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
      .from(purchaseOrders)
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
    const data = await this.drizzle.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, id),
      with: {
        supplier: true,
        items: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Purchase order not found');
    }

    return data;
  }

  async update(userId: number, id: number, data: UpdatePurchaseOrderDto) {
    const { items, ...orderData } = data;

    return await this.drizzle.transaction(async (tx) => {
      const updatedOrder = await tx
        .update(purchaseOrders)
        .set({
          ...orderData,
          updatedById: userId,
        })
        .where(eq(purchaseOrders.id, id))
        .returning();

      if (items) {
        await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
        const orderItems = items.map((item) => ({
          ...item,
          purchaseOrderId: id,
          createdById: userId,
        }));
        await tx.insert(purchaseOrderItems).values(orderItems);
      }

      return updatedOrder[0];
    });
  }

  async remove(id: number) {
    return await this.drizzle.transaction(async (tx) => {
      await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
      await tx.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
      return { message: 'Purchase order removed successfully' };
    });
  }
}
