import {
  purchaseItems,
  purchaseOrders,
} from '@/database/schema/accounts-payable';
import { invoiceSuppliersStatusEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte, ilike, inArray, lte, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { FilterPurchaseOrderDto } from './dto/filter-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseItem } from './entities/purchase-item.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(
    userId: number,
    createPurchaseOrderDto: CreatePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    return this.drizzle.transaction(async (tx) => {
      const existingPurchaseOrder = await tx.query.purchaseOrders.findFirst({
        where: and(
          eq(purchaseOrders.supplierId, createPurchaseOrderDto.supplierId),
          eq(
            purchaseOrders.invoiceNumber,
            createPurchaseOrderDto.invoiceNumber,
          ),
        ),
      });

      if (existingPurchaseOrder) {
        throw new BadRequestException(
          `Purchase order with invoice number '${createPurchaseOrderDto.invoiceNumber}' for supplier ID '${createPurchaseOrderDto.supplierId}' already exists.`,
        );
      }

      const [newPurchaseOrder] = await tx
        .insert(purchaseOrders)
        .values({
          ...createPurchaseOrderDto,
          purchaseDate: createPurchaseOrderDto.purchaseDate
            .toISOString()
            .split('T')[0],
          totalAmount: createPurchaseOrderDto.totalAmount.toString(),
          status:
            createPurchaseOrderDto.status ?? invoiceSuppliersStatusEnum.PENDING,
          createdById: userId,
        })
        .returning();

      if (
        createPurchaseOrderDto.items &&
        createPurchaseOrderDto.items.length > 0
      ) {
        await tx.insert(purchaseItems).values(
          createPurchaseOrderDto.items.map((item) => ({
            ...item,
            purchaseOrderId: newPurchaseOrder.id,
            quantity: item.quantity,
            unitCost: item.unitCost.toString(),
            totalCost: item.totalCost.toString(),
            createdById: userId,
          })),
        );
      }

      return newPurchaseOrder;
    });
  }

  async findAll(
    filterDto: FilterPurchaseOrderDto,
  ): Promise<{ data: PurchaseOrder[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      supplierId,
      invoiceNumber,
      purchaseDateStart,
      purchaseDateEnd,
      status,
    } = filterDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(ilike(purchaseOrders.invoiceNumber, `%${search}%`));
      searchConditions.push(ilike(purchaseOrders.description, `%${search}%`));
    }
    if (supplierId) {
      searchConditions.push(eq(purchaseOrders.supplierId, supplierId));
    }
    if (invoiceNumber) {
      searchConditions.push(
        ilike(purchaseOrders.invoiceNumber, `%${invoiceNumber}%`),
      );
    }
    if (purchaseDateStart) {
      searchConditions.push(
        gte(
          purchaseOrders.purchaseDate,
          purchaseDateStart.toISOString().split('T')[0],
        ),
      );
    }
    if (purchaseDateEnd) {
      searchConditions.push(
        lte(
          purchaseOrders.purchaseDate,
          purchaseDateEnd.toISOString().split('T')[0],
        ),
      );
    }
    if (status) {
      searchConditions.push(eq(purchaseOrders.status, status));
    }

    const finalCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${purchaseOrders[sortBy as keyof typeof purchaseOrders]} asc`
        : sql`${purchaseOrders[sortBy as keyof typeof purchaseOrders]} desc`;

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(purchaseOrders)
      .where(finalCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.drizzle.query.purchaseOrders.findMany({
      where: finalCondition,
      limit: limit,
      offset: offset,
      orderBy: orderBy,
      with: { items: true }, // Eager load purchase items
    });

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

    return {
      data: data.map((order) => ({
        ...order,
        purchaseDate: new Date(order.purchaseDate),
        totalAmount: Number(order.totalAmount),
        items: order.items
          ? (order.items.map((item) => ({
              ...item,
              quantity: Number(item.quantity),
              unitCost: Number(item.unitCost),
              totalCost: Number(item.totalCost),
            })) as PurchaseItem[])
          : [],
      })) as PurchaseOrder[],
      meta,
    };
  }

  async findOne(id: number): Promise<PurchaseOrder> {
    const purchaseOrder = await this.drizzle.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, id),
      with: { items: true }, // Eager load purchase items
    });

    if (!purchaseOrder) {
      throw new NotFoundException(`Purchase order with ID '${id}' not found.`);
    }

    return {
      ...purchaseOrder,
      purchaseDate: new Date(purchaseOrder.purchaseDate),
      totalAmount: Number(purchaseOrder.totalAmount),
      items: purchaseOrder.items
        ? (purchaseOrder.items.map((item) => ({
            ...item,
            quantity: Number(item.quantity),
            unitCost: Number(item.unitCost),
            totalCost: Number(item.totalCost),
          })) as PurchaseItem[])
        : [],
    } as PurchaseOrder;
  }

  async update(
    userId: number,
    id: number,
    updatePurchaseOrderDto: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    return this.drizzle.transaction(async (tx) => {
      const existingPurchaseOrder = await tx.query.purchaseOrders.findFirst({
        where: eq(purchaseOrders.id, id),
        with: { items: true },
      });

      if (!existingPurchaseOrder) {
        throw new NotFoundException(
          `Purchase order with ID '${id}' not found.`,
        );
      }

      if (
        updatePurchaseOrderDto.invoiceNumber &&
        updatePurchaseOrderDto.invoiceNumber !==
          existingPurchaseOrder.invoiceNumber
      ) {
        const orderWithSameInvoiceNumber =
          await tx.query.purchaseOrders.findFirst({
            where: and(
              eq(
                purchaseOrders.supplierId,
                updatePurchaseOrderDto.supplierId ??
                  existingPurchaseOrder.supplierId,
              ),
              eq(
                purchaseOrders.invoiceNumber,
                updatePurchaseOrderDto.invoiceNumber,
              ),
            ),
          });
        if (
          orderWithSameInvoiceNumber &&
          orderWithSameInvoiceNumber.id !== id
        ) {
          throw new BadRequestException(
            `Purchase order with invoice number '${updatePurchaseOrderDto.invoiceNumber}' for supplier ID '${updatePurchaseOrderDto.supplierId ?? existingPurchaseOrder.supplierId}' already exists.`,
          );
        }
      }

      const [updatedPurchaseOrder] = await tx
        .update(purchaseOrders)
        .set({
          ...updatePurchaseOrderDto,
          purchaseDate: updatePurchaseOrderDto.purchaseDate
            ? updatePurchaseOrderDto.purchaseDate.toISOString().split('T')[0]
            : undefined,
          totalAmount: updatePurchaseOrderDto.totalAmount?.toString(),
          updatedById: userId,
        })
        .where(eq(purchaseOrders.id, id))
        .returning();

      if (!updatedPurchaseOrder) {
        throw new NotFoundException(
          `Purchase order with ID '${id}' not found after update attempt.`,
        );
      }

      // Handle purchase items updates
      const existingItemIds = existingPurchaseOrder.items.map(
        (item) => item.id,
      );
      const updatedItemIds = updatePurchaseOrderDto.items
        ? updatePurchaseOrderDto.items
            .filter((item) => item.id)
            .map((item) => item.id)
        : [];

      const itemsToDelete = existingItemIds.filter(
        (id) => !updatedItemIds.includes(id),
      );
      const itemsToCreate = updatePurchaseOrderDto.items
        ? updatePurchaseOrderDto.items.filter((item) => !item.id)
        : [];
      const itemsToUpdate = updatePurchaseOrderDto.items
        ? updatePurchaseOrderDto.items.filter((item) => item.id)
        : [];

      // Delete items
      if (itemsToDelete.length > 0) {
        await tx
          .delete(purchaseItems)
          .where(inArray(purchaseItems.id, itemsToDelete));
      }

      // Create new items
      if (itemsToCreate.length > 0) {
        await tx.insert(purchaseItems).values(
          itemsToCreate.map((item) => ({
            ...item,
            purchaseOrderId: updatedPurchaseOrder.id,
            quantity: item.quantity,
            unitCost: item.unitCost.toString(),
            totalCost: item.totalCost.toString(),
            createdById: userId,
          })),
        );
      }

      // Update existing items
      for (const item of itemsToUpdate) {
        await tx
          .update(purchaseItems)
          .set({
            ...item,
            quantity: item.quantity,
            unitCost: item.unitCost?.toString(),
            totalCost: item.totalCost?.toString(),
            updatedById: userId,
          })
          .where(eq(purchaseItems.id, item.id));
      }

      // Re-fetch the updated purchase order with its items
      const result = await tx.query.purchaseOrders.findFirst({
        where: eq(purchaseOrders.id, id),
        with: { items: true },
      });

      return {
        ...result,
        purchaseDate: new Date(result.purchaseDate),
        totalAmount: Number(result.totalAmount),
        items: result.items
          ? (result.items.map((item) => ({
              ...item,
              quantity: Number(item.quantity),
              unitCost: Number(item.unitCost),
              totalCost: Number(item.totalCost),
            })) as PurchaseItem[])
          : [],
      } as PurchaseOrder;
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    const existingPurchaseOrder = await this.findOne(id);

    // No need to check for purchaseItems here, as cascade delete should handle it if configured in Drizzle
    // If not, you would need to delete purchaseItems first:
    // await this.drizzle.delete(purchaseItems).where(eq(purchaseItems.purchaseOrderId, id));

    await this.drizzle.delete(purchaseOrders).where(eq(purchaseOrders.id, id));

    return { message: `Purchase order with ID '${id}' deleted successfully.` };
  }
}
