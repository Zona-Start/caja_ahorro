import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  fixedAssets,
  products,
  purchaseOrderItems,
  purchaseOrders,
  services,
  suppliers,
  tenants,
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
import { PurchasingPdfService } from '../pdf/purchasing-pdf.service';
import {
  CreatePurchaseOrderDto,
  FilterPurchaseOrderDto,
  FindAllForInvoiceDto,
  UpdatePurchaseOrderDto,
} from './dto/purchase-orders.schema';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
    private readonly purchasingPdfService: PurchasingPdfService,
  ) {}

  private async getItemNameByType(
    itemId: string | null | undefined,
    lineType: string,
    db: any,
  ): Promise<string | null> {
    if (!itemId) return null;

    switch (lineType) {
      case 'SERVICE':
      case 'SERVICE_EXPENSE': {
        const result = await db
          .select({ name: services.name })
          .from(services)
          .where(eq(services.id, itemId as any));
        return result[0]?.name ?? null;
      }
      case 'SALES_INVENTORY': {
        const result = await db
          .select({ name: products.name })
          .from(products)
          .where(eq(products.id, itemId as any));
        return result[0]?.name ?? null;
      }
      case 'FIXED_ASSET': {
        const result = await db
          .select({ name: fixedAssets.name })
          .from(fixedAssets)
          .where(eq(fixedAssets.id, itemId as any));
        return result[0]?.name ?? null;
      }
      case 'EXPENSE': {
        return null;
      }
      default:
        return null;
    }
  }

  private validateOrderItems(
    items?: {
      lineType: string;
      productId?: string;
      itemId?: string;
      description?: string;
      quantity?: number;
      unitCost?: number;
      totalCost?: number;
    }[],
  ) {
    if (!items) return;
    for (const item of items) {
      switch (item.lineType) {
        case 'SALES_INVENTORY':
          if (!item.productId) {
            throw new BadRequestException(
              `For lineType 'SALES_INVENTORY', productId is required.`,
            );
          }
          break;
        case 'FIXED_ASSET':
        case 'SERVICE':
        case 'SERVICE_EXPENSE':
          if (!item.itemId) {
            throw new BadRequestException(
              `For lineType '${item.lineType}', itemId is required.`,
            );
          }
          break;
        case 'EXPENSE':
          if (!item.description) {
            throw new BadRequestException(
              `For lineType 'EXPENSE', description is required.`,
            );
          }
          break;
      }
    }
  }

  async create(tenantId: string, userId: string, data: CreatePurchaseOrderDto) {
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
      tenantId,
      supplierId: orderData.supplierId,
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
      currencyCode: (orderData.currencyCode || 'VES') as CurrencyCodeEnum,
      observations: orderData.observations,
      status: (orderData.status || 'DRAFT') as any,
      orderNumber: await this.generateCodeService.generateNextReference(
        'ORD',
        tenantId,
        'purchasing',
        'purchase_orders',
      ),
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
        await tx.insert(purchaseOrderItems).values(orderItems as any);
      }

      return newOrder[0];
    });
  }

  async findAll(paginationDto: FilterPurchaseOrderDto, tenantId: string) {
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

    const searchConditions: SQL<unknown>[] = [
      eq(purchaseOrders.tenantId, tenantId),
    ];
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
      searchConditions.push(
        sql`${purchaseOrders.orderDate} >= ${String(startDate)}`,
      );
    }
    if (endDate) {
      searchConditions.push(
        sql`${purchaseOrders.orderDate} <= ${String(endDate)}`,
      );
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

    const allItems = await this.drizzle
      .select()
      .from(purchaseOrderItems)
      .where(sql`${purchaseOrderItems.purchaseOrderId} IN ${ordersIds}`);

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

  async findAllForInvoice(params: FindAllForInvoiceDto, tenantId: string) {
    const { supplierId, status } = params;

    const searchConditions: SQL<unknown>[] = [
      eq(purchaseOrders.tenantId, tenantId),
    ];

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

  async findOne(id: string, tenantId: string) {
    const data = await this.drizzle.query.purchaseOrders.findFirst({
      where: and(
        eq(purchaseOrders.id, id),
        eq(purchaseOrders.tenantId, tenantId),
      ),
      with: {
        supplier: true,
        items: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Purchase order not found');
    }

    const productIds = (data.items ?? [])
      .filter((item: any) => item.productId && item.lineType === 'SALES_INVENTORY')
      .map((item: any) => item.productId);

    const itemIds = (data.items ?? [])
      .filter((item: any) => item.itemId && !item.productId)
      .map((item: any) => item.itemId);

    const productMap = new Map<string, string>();
    const serviceMap = new Map<string, string>();

    const allIds = [...productIds, ...itemIds];

    if (allIds.length > 0) {
      const productRows = await this.drizzle
        .select({ id: products.id, name: products.name })
        .from(products)
        .where(inArray(products.id, allIds as any));

      for (const p of productRows) {
        productMap.set(String(p.id), p.name);
      }

      const serviceRows = await this.drizzle
        .select({ id: services.id, name: services.name })
        .from(services)
        .where(inArray(services.id, allIds as any));

      for (const s of serviceRows) {
        serviceMap.set(String(s.id), s.name);
      }
    }

    const enrichedItems = (data.items ?? []).map((item: any) => {
      let itemName: string | null = null;
      const lookupId = String(item.productId || item.itemId || '');
      if (lookupId) {
        if (item.lineType === 'SALES_INVENTORY' || item.lineType === 'FIXED_ASSET') {
          itemName = productMap.get(lookupId) || null;
        } else if (item.lineType === 'SERVICE' || item.lineType === 'SERVICE_EXPENSE') {
          itemName = serviceMap.get(lookupId) || null;
        }
      }
      return { ...item, itemName };
    });

    return { ...data, items: enrichedItems };
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    data: UpdatePurchaseOrderDto,
  ) {
    const { items, ...orderData } = data;

    const existingOrder = await this.drizzle.query.purchaseOrders.findFirst({
      where: and(
        eq(purchaseOrders.id, id),
        eq(purchaseOrders.tenantId, tenantId),
      ),
    });

    if (!existingOrder) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    const editableStatuses = ['DRAFT'];
    if (!editableStatuses.includes(existingOrder.status)) {
      throw new BadRequestException(
        `La orden con estatus '${existingOrder.status}' no puede ser modificada. Solo se permite editar en DRAFT.`,
      );
    }

    this.validateOrderItems(items);

    const updatePayload: Record<string, any> = {
      ...orderData,
      updatedById: userId,
      subtotal:
        typeof orderData.subtotal === 'number'
          ? String(orderData.subtotal)
          : orderData.subtotal,
      totalAmount:
        typeof orderData.totalAmount === 'number'
          ? String(orderData.totalAmount)
          : orderData.totalAmount,
      taxAmount:
        typeof orderData.taxAmount === 'number'
          ? String(orderData.taxAmount)
          : orderData.taxAmount,
      currencyCode: (orderData.currencyCode || 'VES') as CurrencyCodeEnum,
      orderDate:
        orderData.orderDate instanceof Date
          ? orderData.orderDate.toISOString()
          : orderData.orderDate,
      expectedDeliveryDate:
        orderData.expectedDeliveryDate instanceof Date
          ? orderData.expectedDeliveryDate.toISOString()
          : orderData.expectedDeliveryDate,
    };

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
          .where(
            and(
              eq(purchaseOrders.id, id),
              eq(purchaseOrders.tenantId, tenantId),
            ),
          )
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
          await tx.insert(purchaseOrderItems).values(orderItems as any);
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
      .where(
        and(eq(purchaseOrders.id, id), eq(purchaseOrders.tenantId, tenantId)),
      )
      .returning();

    return updatedOrder[0];
  }

  async remove(id: string, tenantId: string) {
    const order = await this.drizzle.query.purchaseOrders.findFirst({
      where: and(
        eq(purchaseOrders.id, id),
        eq(purchaseOrders.tenantId, tenantId),
      ),
      with: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    const allowedStatus = ['DRAFT', 'APPROVED'];

    if (!allowedStatus.includes(order.status)) {
      throw new BadRequestException(
        `La orden con estatus '${order.status}' no puede ser anulada. Solo DRAFT y APPROVED.`,
      );
    }

    const hasRecepcion = (order.items ?? []).some(
      (item) => Number(item.quantityReceived) > 0,
    );
    if (hasRecepcion) {
      throw new BadRequestException(
        'No se puede anular la orden porque ya tiene recepciones registradas (quantityReceived > 0).',
      );
    }

    return this.drizzle.transaction(async (tx) => {
      if (order.status === 'APPROVED') {
        for (const item of order.items ?? []) {
          if (
            item.lineType === 'SALES_INVENTORY' &&
            item.productId
          ) {
            await tx
              .update(products)
              .set({
                stockOnOrder: sql`${products.stockOnOrder} - ${Number(item.quantity)}`,
              })
              .where(eq(products.id, item.productId));
          }
        }
      }

      await tx
        .update(purchaseOrders)
        .set({ status: 'CANCELLED' })
        .where(
          and(eq(purchaseOrders.id, id), eq(purchaseOrders.tenantId, tenantId)),
        );

      return { message: 'Orden de compra anulada exitosamente' };
    });
  }

  async updateStatusToClosed(id: string, tenantId: string) {
    const order = await this.drizzle
      .select()
      .from(purchaseOrders)
      .where(
        and(eq(purchaseOrders.id, id), eq(purchaseOrders.tenantId, tenantId)),
      );

    if (order.length === 0) {
      throw new NotFoundException(`Purchase Order with ID ${id} not found`);
    }

    if (order[0].status === 'CLOSED' || order[0].status === 'CANCELLED' || order[0].status === 'DRAFT') {
      throw new BadRequestException(
        `Purchase Order ${id} cannot be closed from its current status: ${order[0].status}`,
      );
    }

    const [updatedOrder] = await this.drizzle
      .update(purchaseOrders)
      .set({ status: 'CLOSED' })
      .where(
        and(eq(purchaseOrders.id, id), eq(purchaseOrders.tenantId, tenantId)),
      )
      .returning();

    return updatedOrder;
  }

  async approve(id: string, tenantId: string) {
    const order = await this.drizzle.query.purchaseOrders.findFirst({
      where: and(
        eq(purchaseOrders.id, id),
        eq(purchaseOrders.tenantId, tenantId),
      ),
      with: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    if (order.status !== 'DRAFT') {
      throw new BadRequestException(
        `La orden en estatus '${order.status}' no puede ser aprobada. Solo se permite aprobar desde DRAFT.`,
      );
    }

    return this.drizzle.transaction(async (tx) => {
      // Incrementar stockOnOrder para productos
      for (const item of order.items ?? []) {
        if (
          item.lineType === 'SALES_INVENTORY' &&
          item.productId
        ) {
          await tx
            .update(products)
            .set({
              stockOnOrder: sql`${products.stockOnOrder} + ${Number(item.quantity)}`,
            })
            .where(eq(products.id, item.productId));
        }
      }

      const [updated] = await tx
        .update(purchaseOrders)
        .set({ status: 'APPROVED' })
        .where(
          and(eq(purchaseOrders.id, id), eq(purchaseOrders.tenantId, tenantId)),
        )
        .returning();

      return updated;
    });
  }

  async generatePdf(
    id: string,
    tenantId: string,
  ): Promise<PDFKit.PDFDocument> {
    const order = await this.drizzle.query.purchaseOrders.findFirst({
      where: and(
        eq(purchaseOrders.id, id),
        eq(purchaseOrders.tenantId, tenantId),
      ),
      with: {
        supplier: true,
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    const [tenant] = await this.drizzle
      .select({
        name: tenants.name,
        rif: tenants.rif,
        address: tenants.address,
        phone: tenants.phone,
        email: tenants.email,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    if (!tenant) {
      throw new NotFoundException('Empresa no encontrada');
    }

    const productIds = (order.items ?? [])
      .filter((item: any) => item.productId && item.lineType === 'SALES_INVENTORY')
      .map((item: any) => item.productId);
    const legacyItemIds = (order.items ?? [])
      .filter((item: any) => item.itemId && !item.productId)
      .map((item: any) => item.itemId);

    const allLookupIds = [...productIds, ...legacyItemIds];

    const productMap = new Map<string, string>();
    const serviceMap = new Map<string, string>();

    if (allLookupIds.length > 0) {
      const productRows = await this.drizzle
        .select({ id: products.id, name: products.name })
        .from(products)
        .where(inArray(products.id, allLookupIds as any));

      for (const p of productRows) {
        productMap.set(String(p.id), p.name);
      }

      const serviceRows = await this.drizzle
        .select({ id: services.id, name: services.name })
        .from(services)
        .where(inArray(services.id, allLookupIds as any));

      for (const s of serviceRows) {
        serviceMap.set(String(s.id), s.name);
      }
    }

    const items =
      order.items?.map((item: any) => {
        const qty = Number(item.quantity);
        const unitCost = Number(item.unitCost);
        const subtotal = qty * unitCost;

        let description = item.description ?? '';
        const lookupId = String(item.productId || item.itemId || '');
        if (lookupId) {
          if (item.lineType === 'SALES_INVENTORY' || item.lineType === 'FIXED_ASSET') {
            description = productMap.get(lookupId) || item.description || 'Producto sin nombre';
          } else if (item.lineType === 'SERVICE' || item.lineType === 'SERVICE_EXPENSE') {
            description = serviceMap.get(lookupId) || item.description || 'Servicio sin nombre';
          }
        }
        if (!description) {
          description = item.lineType === 'EXPENSE' ? 'Gasto' : `Ítem ${item.lineType}`;
        }

        return {
          description,
          quantity: qty,
          unitCost,
          taxPercent: 16,
          totalLine: Number(item.totalCost ?? subtotal),
        };
      }) ?? [];

    const subtotal = Number(order.subtotal);
    const taxAmount = Number(order.taxAmount);
    const totalAmount = Number(order.totalAmount);

    const numericRef = order.orderNumber.replace(/^[A-Z]+-/, '');

    return this.purchasingPdfService.generate({
      title: 'ORDEN DE COMPRA',
      reference: order.orderNumber,
      numericReference: numericRef,
      date: new Date(order.orderDate),
      supplier: {
        name: (order.supplier as any)?.name ?? '—',
        taxId: (order.supplier as any)?.taxId ?? '—',
        address: (order.supplier as any)?.address ?? null,
        phone: (order.supplier as any)?.phone ?? null,
        email: (order.supplier as any)?.email ?? null,
      },
      currencyCode: order.currencyCode,
      items,
      totals: { subtotal, taxAmount, totalAmount },
      observations: order.observations ?? undefined,
      tenant: {
        name: tenant.name,
        rif: tenant.rif,
        address: tenant.address,
        phone: tenant.phone,
        email: tenant.email,
      },
    });
  }
}
