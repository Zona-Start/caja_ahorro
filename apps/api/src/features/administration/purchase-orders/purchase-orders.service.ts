import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import {
  fixedAssets,
  products,
  purchaseOrderItems,
  purchaseOrders,
  services,
  suppliers,
} from '@/database/schema/tables';
import { CurrencyCodeEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { FilterPurchaseOrderDto } from './dto/filter-purchase-order.dto';
import { FindAllForInvoiceDto } from './dto/find-all-for-invoice.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
  ) {}

  ///metodo para buscar datos de items
  private async getItemNameByType(
    itemId: number | null | undefined,
    lineType: string,
    db: any, // tu instancia Drizzle
  ): Promise<string | null> {
    if (!itemId) return null;

    switch (lineType) {
      case 'SERVICE':
      case 'SERVICE_EXPENSE': {
        const result = await db
          .select({ name: services.name })
          .from(services)
          .where(eq(services.id, itemId));
        return result[0]?.name ?? null;
      }
      case 'SALES_INVENTORY': {
        const result = await db
          .select({ name: products.name })
          .from(products)
          .where(eq(products.id, itemId));
        return result[0]?.name ?? null;
      }
      case 'FIXED_ASSET': {
        const result = await db
          .select({ name: fixedAssets.name })
          .from(fixedAssets)
          .where(eq(fixedAssets.id, itemId));
        return result[0]?.name ?? null;
      }
      case 'EXPENSE': {
        // Para EXPENSE debes pasar además la descripción
        // Aquí solo devolvemos null, el nombre vendría en item.description
        return null;
      }
      default:
        return null;
    }
  }

  //metodo para validar ordenes
  private validateOrderItems(
    items?: {
      lineType: string;
      itemId?: number;
      expenseAccountId?: number;
      description: string;
    }[],
  ) {
    if (!items) return;
    for (const item of items) {
      switch (item.lineType) {
        case 'PRODUCT':
          if (!item.itemId) {
            throw new BadRequestException(
              `For lineType 'PRODUCT', productId is required.`,
            );
          }
          break;
        case 'FIXED_ASSET':
          if (!item.itemId) {
            throw new BadRequestException(
              `For lineType 'FIXED_ASSET', fixedAssetId is required.`,
            );
          }
          break;
        case 'SERVICE':
          if (!item.itemId) {
            throw new BadRequestException(
              `For lineType 'SERVICE', serviceId is required.`,
            );
          }
          break;
        case 'EXPENSE':
          if (!item.description) {
            throw new BadRequestException(
              `For lineType 'EXPENSE', expenseAccountId is required.`,
            );
          }
          break;
      }
    }
  }

  //metodo para crear una orden
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

  //busqueda de todas las ordenes
  async findAll(paginationDto: FilterPurchaseOrderDto) {
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
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Paso 2: Obtener solo las ordenes (sin ítems) con paginación
    const orders = await this.drizzle
      .select({
        order: purchaseOrders,
        supplierName: suppliers.name,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .limit(limit)
      .offset(offset)
      .where(searchCondition)
      .orderBy(orderBy);

    const ordersIds = orders.map((row) => row.order.id);
    // Si no hay ordenes, devolvemos un array vacío para los ítems
    if (ordersIds.length === 0) {
      return {
        data: [],
        meta: {
          page: Number(page),
          limit: Number(limit),
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          nextPage: page < totalPages ? page + 1 : null,
          previousPage: page > 1 ? page - 1 : null,
        },
      };
    }

    // Paso 3: Obtener todos los ítems de las ordenes seleccionadas
    const allItems = await this.drizzle
      .select()
      .from(purchaseOrderItems)
      .where(sql`${purchaseOrderItems.purchaseOrderId} IN ${ordersIds}`);

    // Paso 4: Agrupar los ítems a cada factura en el código (async map)
    const data = await Promise.all(
      orders.map(async (orderRow) => {
        const order = {
          id: orderRow.order.id,
          orderNumber: orderRow.order.orderNumber,
          supplierId: orderRow.order.supplierId,
          supplierName: orderRow.supplierName,
          status: orderRow.order.status,
          observations: orderRow.order.observations,
          orderDate: orderRow.order.orderDate,
          expectedDeliveryDate: orderRow.order.expectedDeliveryDate,
          subtotal: Number(orderRow.order.subtotal),
          taxAmount: Number(orderRow.order.taxAmount),
          totalAmount: Number(orderRow.order.totalAmount),
          items: [] as any[],
        };

        const orderItems = allItems.filter(
          (item) => item.purchaseOrderId === order.id,
        );

        order.items = await Promise.all(
          orderItems.map(async (item) => {
            const name = await this.getItemNameByType(
              item.itemId,
              item.lineType,
              this.drizzle,
            );
            const itemName =
              item.lineType === 'EXPENSE' ? item.description : name;
            return {
              id: item.id,
              lineType: item.lineType,
              description: item.description,
              itemId: item.itemId,
              itemName,
              quantity: Number(item.quantity),
              unitCost: Number(item.unitCost),
              totalCost: Number(item.totalCost),
            };
          }),
        );

        return order;
      }),
    );

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

  //busqueda de todas las ordenes segun facturas
  async findAllForInvoice(params: FindAllForInvoiceDto) {
    const { supplierId, status } = params;

    let searchConditions: SQL<unknown>[] = [];

    if (supplierId) {
      searchConditions.push(eq(purchaseOrders.supplierId, supplierId));
    }

    if (status && status.length > 0) {
      searchConditions.push(inArray(purchaseOrders.status, status as any));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orders = await this.drizzle
      .select({
        order: purchaseOrders,
        supplierName: suppliers.name,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .where(searchCondition)
      .orderBy(sql`${purchaseOrders.id} desc`);

    const ordersIds = orders.map((row) => row.order.id);
    if (ordersIds.length === 0) {
      return [];
    }

    const allItems = await this.drizzle
      .select()
      .from(purchaseOrderItems)
      .where(sql`${purchaseOrderItems.purchaseOrderId} IN ${ordersIds}`);

    const data = orders.map((orderRow) => {
      const order = {
        id: orderRow.order.id,
        orderNumber: orderRow.order.orderNumber,
        supplierId: orderRow.order.supplierId,
        supplierName: orderRow.supplierName,
        status: orderRow.order.status,
        observations: orderRow.order.observations,
        orderDate: orderRow.order.orderDate,
        expectedDeliveryDate: orderRow.order.expectedDeliveryDate,
        subtotal: Number(orderRow.order.subtotal),
        taxAmount: Number(orderRow.order.taxAmount),
        totalAmount: Number(orderRow.order.totalAmount),
        items: [] as any[],
      };

      const relatedItems = allItems.filter(
        (item) => item.purchaseOrderId === order.id,
      );

      order.items = relatedItems.map((item) => ({
        id: item.id,
        lineType: item.lineType,
        description: item.description,
        itemId: item.itemId,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        totalCost: Number(item.totalCost),
      }));

      return order;
    });

    return data;
  }

  //metodo de busqueda de una sola orden
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

  //metodo para actualizar ordenes
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

  //metodo para cancelar una orden
  async remove(id: number) {
    const order = await this.drizzle.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, id),
    });

    if (!order) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    const allowedStatus = ['DRAFT', 'PENDING'];

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

  //metodo para cerrar ordenes
  async updateStatusToClosed(id: number) {
    const order = await this.drizzle
      .select()
      .from(purchaseOrders)
      .where(eq(schema.purchaseOrders.id, id));

    if (order.length === 0) {
      throw new NotFoundException(`Purchase Order with ID ${id} not found`);
    }

    // Only allow closing if it's not already closed or cancelled
    if (order[0].status === 'CLOSED' || order[0].status === 'CANCELLED') {
      throw new BadRequestException(
        `Purchase Order ${id} cannot be closed from its current status: ${order[0].status}`,
      );
    }

    const [updatedOrder] = await this.drizzle
      .update(schema.purchaseOrders)
      .set({ status: 'CLOSED' })
      .where(eq(schema.purchaseOrders.id, id))
      .returning();

    return updatedOrder;
  }
}
