import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import {
  purchaseOrderItems,
  purchaseOrders,
  suppliers,
} from '@/database/schema/administration';
import { CurrencyCodeEnum } from '@/types/enum';
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
    private readonly generateCodeService: GenerateCodeService,
  ) {}

  private validateOrderItems(
    items?: {
      lineType: string;
      itemId?: number;
      expenseAccountId?: number;
      itemName: string;
    }[],
  ) {
    if (!items) return;
    for (const item of items) {
      switch (item.lineType) {
        case 'PRODUCT':
          if (!item.itemId) {
            throw new BadRequestException(
              `For lineType 'PRODUCT', productId is required. Item: ${item.itemName}`,
            );
          }
          break;
        case 'FIXED_ASSET':
          if (!item.itemId) {
            throw new BadRequestException(
              `For lineType 'FIXED_ASSET', fixedAssetId is required. Item: ${item.itemName}`,
            );
          }
          break;
        case 'SERVICE':
          if (!item.itemId) {
            throw new BadRequestException(
              `For lineType 'SERVICE', serviceId is required. Item: ${item.itemName}`,
            );
          }
          break;
        case 'EXPENSE':
          if (!item.itemName) {
            throw new BadRequestException(
              `For lineType 'EXPENSE', expenseAccountId is required. Item: ${item.itemName}`,
            );
          }
          break;
      }
    }
  }

  async create(userId: number, data: CreatePurchaseOrderDto) {
    const { items, ...orderData } = data;

    this.validateOrderItems(items);

    let calculatedSubtotal = 0;
    const processedItems: typeof items = [];

    if (items && items.length > 0) {
      for (const item of items) {
        const totalCost = parseFloat(
          (item.quantity * item.unitCost).toFixed(2),
        );
        calculatedSubtotal += totalCost;
        processedItems.push({ ...item, totalCost });
      }
    }

    calculatedSubtotal = parseFloat(calculatedSubtotal.toFixed(2));
    const taxAmount = orderData.taxAmount || 0;
    const calculatedTotalAmount = parseFloat(
      (calculatedSubtotal + taxAmount).toFixed(2),
    );

    const finalOrderData = {
      ...orderData,
      subtotal: calculatedSubtotal.toString(),
      taxAmount: taxAmount.toString(),
      totalAmount: calculatedTotalAmount.toString(),
      createdById: userId,
      orderDate:
        orderData.orderDate instanceof Date
          ? orderData.orderDate.toISOString()
          : orderData.orderDate,
      expectedDeliveryDate:
        orderData.expectedDeliveryDate instanceof Date
          ? orderData.expectedDeliveryDate.toISOString()
          : orderData.expectedDeliveryDate,
      currencyCode: 'VES' as CurrencyCodeEnum, // Default to VES if not provided
      orderNumber: await this.generateCodeService.generateNextReference('ORD'), // Ensure orderNumber is present
    };

    return await this.drizzle.transaction(async (tx) => {
      const newOrder = await tx
        .insert(purchaseOrders)
        .values(finalOrderData)
        .returning();

      if (processedItems.length > 0) {
        const orderItems = processedItems.map((item) => ({
          ...item,
          purchaseOrderId: newOrder[0].id,
          quantity: Number(item.quantity),
          unitCost: String(item.unitCost),
          totalCost: String(item.totalCost),
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

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(purchaseOrders)
      .leftJoin(
        purchaseOrderItems,
        eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId),
      )
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const rawData = await this.drizzle
      .select({
        order: purchaseOrders,
        item: purchaseOrderItems,
        supplierName: suppliers.name,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .leftJoin(
        purchaseOrderItems,
        eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId),
      )
      .limit(limit)
      .offset(offset)
      .where(searchCondition)
      .orderBy(orderBy);

    // 3. Agrupa los ítems por orden en el código
    const groupedData = new Map<number, any>();

    rawData.forEach((row) => {
      if (!groupedData.has(row.order.id)) {
        // Mapea la orden y convierte los strings a numbers según tu esquema Zod

        const order = {
          id: row.order.id,
          orderNumber: row.order.orderNumber,
          supplierId: row.order.supplierId,
          supplierName: row.supplierName,
          status: row.order.status,
          observations: row.order.observations,
          orderDate: row.order.orderDate,
          expectedDeliveryDate: row.order.expectedDeliveryDate,
          subtotal: Number(row.order.subtotal),
          taxAmount: Number(row.order.taxAmount),
          totalAmount: Number(row.order.totalAmount),
          items: [],
        };
        groupedData.set(row.order.id, order);
      }

      // Mapea y convierte el ítem si existe
      if (row.item) {
        const item = {
          id: row.item.id,
          lineType: row.item.lineType,
          description: row.item.description,
          itemId: row.item.itemId,
          itemName: row.item.itemName,
          quantity: Number(row.item.quantity),
          unitCost: Number(row.item.unitCost),
          totalCost: Number(row.item.totalCost),
        };
        groupedData.get(row.order.id).items.push(item);
      }
    });

    const data = Array.from(groupedData.values());

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

    const existingOrder = await this.drizzle.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, id),
    });

    if (!existingOrder) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    const editableStatuses = ['DRAFT', 'PENDING'];
    if (!editableStatuses.includes(existingOrder.status)) {
      throw new BadRequestException(
        `La orden con estatus '${existingOrder.status}' no puede ser modificada.`,
      );
    }

    this.validateOrderItems(items);

    const updatePayload: Partial<typeof purchaseOrders.$inferInsert> = {
      ...orderData,
      updatedById: userId,
      // Convertir el subtotal a string si existe
      subtotal:
        typeof orderData.subtotal === 'number'
          ? String(orderData.subtotal)
          : orderData.subtotal,
      // Convertir el totalAmount a string si existe
      totalAmount:
        typeof orderData.totalAmount === 'number'
          ? String(orderData.totalAmount)
          : orderData.totalAmount,
      // Convertir el taxAmount a string si existe
      taxAmount:
        typeof orderData.taxAmount === 'number'
          ? String(orderData.taxAmount)
          : orderData.taxAmount,
      currencyCode: 'VES' as CurrencyCodeEnum, // Default to VES if not provided
      orderDate:
        orderData.orderDate instanceof Date
          ? orderData.orderDate.toISOString()
          : orderData.orderDate,
      expectedDeliveryDate:
        orderData.expectedDeliveryDate instanceof Date
          ? orderData.expectedDeliveryDate.toISOString()
          : orderData.expectedDeliveryDate,
    };

    // If items are passed, we do a full recalculation
    if (items) {
      let calculatedSubtotal = 0;
      const processedItems: typeof items = [];

      if (items.length > 0) {
        for (const item of items) {
          const totalCost = parseFloat(
            (item.quantity * item.unitCost).toFixed(2),
          );
          calculatedSubtotal += totalCost;
          processedItems.push({ ...item, totalCost });
        }
      }

      calculatedSubtotal = parseFloat(calculatedSubtotal.toFixed(2));
      const taxAmount =
        orderData.taxAmount ?? parseFloat(existingOrder.taxAmount ?? '0');
      const calculatedTotalAmount = parseFloat(
        (calculatedSubtotal + taxAmount).toFixed(2),
      );

      updatePayload.subtotal = calculatedSubtotal.toString();
      updatePayload.taxAmount = taxAmount.toString();
      updatePayload.totalAmount = calculatedTotalAmount.toString();

      return await this.drizzle.transaction(async (tx) => {
        const updatedOrder = await tx
          .update(purchaseOrders)
          .set(updatePayload)
          .where(eq(purchaseOrders.id, id))
          .returning();

        await tx
          .delete(purchaseOrderItems)
          .where(eq(purchaseOrderItems.purchaseOrderId, id));

        if (processedItems.length > 0) {
          const orderItems = processedItems.map((item) => ({
            ...item,
            purchaseOrderId: id,
            createdById: userId,
            unitCost: String(item.unitCost),
            totalCost: String(item.totalCost),
            description: item.description ?? '',
            itemName: item.itemName ?? '',
            quantity: Number(item.quantity),
          }));
          await tx.insert(purchaseOrderItems).values(orderItems);
        }
        return updatedOrder[0];
      });
    } else if (orderData.taxAmount !== undefined) {
      const subtotal = parseFloat(existingOrder.subtotal);
      const taxAmount = orderData.taxAmount;
      updatePayload.totalAmount = parseFloat(
        (subtotal + taxAmount).toFixed(2),
      ).toString();
    }

    const updatedOrder = await this.drizzle
      .update(purchaseOrders)
      .set(updatePayload)
      .where(eq(purchaseOrders.id, id))
      .returning();

    return updatedOrder[0];
  }

  async remove(id: number) {
    const order = await this.drizzle.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, id),
    });

    if (!order) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    const allowedStatus = ['DRAFT', 'PENDING', 'RECEIVED', 'INVOICED'];

    if (!allowedStatus.includes(order.status)) {
      throw new BadRequestException(
        `La orden con estatus '${order.status}' no puede ser anulada.`,
      );
    }

    await this.drizzle
      .update(purchaseOrders)
      .set({ status: 'CANCELLED' })
      .where(eq(purchaseOrders.id, id));

    return { message: 'Orden de compra anulada exitosamente' };
  }
}
