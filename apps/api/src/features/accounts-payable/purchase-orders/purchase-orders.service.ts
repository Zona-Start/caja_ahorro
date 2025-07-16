import {
  purchaseItems,
  purchaseOrders,
} from '@/database/schema/accounts-payable';
import { invoiceSuppliersStatusEnum, purchaseItemTypeEnum } from '@/types/enum';
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
import { fixedAssets, salesProducts } from 'src/database/index';
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
          purchaseType: createPurchaseOrderDto.purchaseType,
          totalAmount: createPurchaseOrderDto.totalAmount.toString(),
          status:
            createPurchaseOrderDto.status ?? invoiceSuppliersStatusEnum.PENDING,
          currencyCode: 'VES',
          createdById: userId,
        })
        .returning({
          id: purchaseOrders.id,
          supplierId: purchaseOrders.supplierId,
          invoiceNumber: purchaseOrders.invoiceNumber,
          purchaseDate: purchaseOrders.purchaseDate,
          purchaseType: purchaseOrders.purchaseType,
          totalAmount: purchaseOrders.totalAmount,
          payableId: purchaseOrders.payableId,
          status: purchaseOrders.status,
          description: purchaseOrders.description,
        });

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

        for (const item of createPurchaseOrderDto.items) {
          if (item.itemType === 'SALES_INVENTORY' && item.salesProductId) {
            // Se calcula el precio de venta con un margen de ganancia del 30% sobre el costo.
            const sellingPrice = item.unitCost * 1.3;
            await tx
              .update(salesProducts)
              .set({
                defaultPurchaseCost: String(item.unitCost),
                defaultSellingPrice: String(sellingPrice),
                currentStock: sql`${salesProducts.currentStock} + ${item.quantity}`,
                updatedById: userId,
              })
              .where(eq(salesProducts.id, item.salesProductId));
          } else if (item.itemType === 'FIXED_ASSET' && item.fixedAssetId) {
            await tx
              .update(fixedAssets)
              .set({
                purchasePrice: String(item.unitCost),
                currentStock: sql`${fixedAssets.currentStock} + ${item.quantity}`,
                updatedById: userId,
              })
              .where(eq(fixedAssets.id, item.fixedAssetId));
          }
        }
      }

      return {
        ...newPurchaseOrder,
        purchaseDate: new Date(newPurchaseOrder.purchaseDate),
        totalAmount: Number(newPurchaseOrder.totalAmount),
        payableId:
          newPurchaseOrder.payableId === null
            ? undefined
            : newPurchaseOrder.payableId,
        status: newPurchaseOrder.status as invoiceSuppliersStatusEnum,
        description:
          newPurchaseOrder.description === null
            ? undefined
            : newPurchaseOrder.description,
      };
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

    // Obtiene las órdenes según el filtro y paginación
    const data = await this.drizzle
      .select({
        id: purchaseOrders.id,
        supplierId: purchaseOrders.supplierId,
        supplierName: schema.suppliers.name,
        invoiceNumber: purchaseOrders.invoiceNumber,
        purchaseDate: purchaseOrders.purchaseDate,
        purchaseType: purchaseOrders.purchaseType,
        totalAmount: purchaseOrders.totalAmount,
        status: purchaseOrders.status,
        description: purchaseOrders.description,
      })
      .from(purchaseOrders)
      .leftJoin(
        schema.suppliers,
        eq(schema.suppliers.id, purchaseOrders.supplierId),
      )
      .where(finalCondition)
      .offset(offset)
      .orderBy(orderBy)
      .limit(limit);

    // Extraer ids de las órdenes para traer sus items
    const orderIds = data.map((order) => order.id);

    // Traer todos los items de las órdenes listadas
    const orderItems =
      orderIds.length > 0
        ? await this.drizzle
            .select({
              id: purchaseItems.id,
              itemType: purchaseItems.itemType,
              itemName: purchaseItems.itemName,
              quantity: purchaseItems.quantity,
              unitCost: purchaseItems.unitCost,
              totalCost: purchaseItems.totalCost,
              salesProductId: purchaseItems.salesProductId,
              fixedAssetId: purchaseItems.fixedAssetId,
              purchaseOrderId: purchaseItems.purchaseOrderId, // necesario para agrupar
            })
            .from(purchaseItems)
            .where(
              // Aquí debes usar el filtro correcto para IN. Ejemplo con sql`... IN (...)`
              sql`${purchaseItems.purchaseOrderId} IN (${
                orderIds.length > 0
                  ? sql.join(
                      orderIds.map((id) => sql`${id}`),
                      sql`,`,
                    )
                  : sql`NULL`
              })`,
            )
        : [];

    // Agrupar items por purchaseOrderId
    const itemsByOrderId = orderItems.reduce<Record<number, PurchaseItem[]>>(
      (acc, item) => {
        if (!acc[item.purchaseOrderId]) acc[item.purchaseOrderId] = [];
        acc[item.purchaseOrderId].push({
          ...item,
          fixedAssetId: item.fixedAssetId ?? undefined,
          salesProductId: item.salesProductId ?? undefined,
          itemType: item.itemType as purchaseItemTypeEnum,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
          totalCost: Number(item.totalCost),
        });
        return acc;
      },
      {},
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

    return {
      data: data.map((order) => ({
        ...order,
        purchaseDate: new Date(order.purchaseDate),
        totalAmount: Number(order.totalAmount),
        items: itemsByOrderId[order.id] || [],
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
          purchaseType: updatePurchaseOrderDto.purchaseType,
          totalAmount: updatePurchaseOrderDto.totalAmount?.toString(),
          updatedById: userId,
        })
        .where(eq(purchaseOrders.id, id))
        .returning({
          id: purchaseOrders.id,
          supplierId: purchaseOrders.supplierId,
          invoiceNumber: purchaseOrders.invoiceNumber,
          purchaseDate: purchaseOrders.purchaseDate,
          purchaseType: purchaseOrders.purchaseType,
          totalAmount: purchaseOrders.totalAmount,
          payableId: purchaseOrders.payableId,
          status: purchaseOrders.status,
          description: purchaseOrders.description,
        });

      if (!updatedPurchaseOrder) {
        throw new NotFoundException(
          `Purchase order with ID '${id}' not found after update attempt.`,
        );
      }

      const findPurchaseOrderItem = await tx.query.purchaseItems.findMany({
        where: eq(purchaseItems.purchaseOrderId, updatedPurchaseOrder.id),
      });

      // Handle purchase items updates
      const existingItemIds = findPurchaseOrderItem.map((item) => item.id);
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

      // Adjust stock for deleted items
      if (itemsToDelete.length > 0) {
        const deletedItems = findPurchaseOrderItem.filter((item) =>
          itemsToDelete.includes(item.id),
        );
        for (const item of deletedItems) {
          if (item.itemType === 'SALES_INVENTORY' && item.salesProductId) {
            await tx
              .update(salesProducts)
              .set({
                currentStock: sql`${salesProducts.currentStock} - ${item.quantity}`,
                updatedById: userId,
              })
              .where(eq(salesProducts.id, item.salesProductId));
          } else if (item.itemType === 'FIXED_ASSET' && item.fixedAssetId) {
            await tx
              .update(fixedAssets)
              .set({
                currentStock: sql`${fixedAssets.currentStock} - ${item.quantity}`,
                updatedById: userId,
              })
              .where(eq(fixedAssets.id, item.fixedAssetId));
          }
        }
        await tx
          .delete(purchaseItems)
          .where(inArray(purchaseItems.id, itemsToDelete));
      }

      // Create new items and adjust stock
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

        for (const item of itemsToCreate) {
          if (item.itemType === 'SALES_INVENTORY' && item.salesProductId) {
            const sellingPrice = item.unitCost * 1.3;
            await tx
              .update(salesProducts)
              .set({
                defaultPurchaseCost: String(item.unitCost),
                defaultSellingPrice: String(sellingPrice),
                currentStock: sql`${salesProducts.currentStock} + ${item.quantity}`,
              })
              .where(eq(salesProducts.id, item.salesProductId));
          } else if (item.itemType === 'FIXED_ASSET' && item.fixedAssetId) {
            await tx
              .update(fixedAssets)
              .set({
                purchasePrice: String(item.unitCost),
                currentStock: sql`${fixedAssets.currentStock} + ${item.quantity}`,
              })
              .where(eq(fixedAssets.id, item.fixedAssetId));
          }
        }
      }

      // Update existing items and adjust stock
      for (const item of itemsToUpdate) {
        const existingItem = findPurchaseOrderItem.find(
          (i) => i.id === item.id,
        );

        if (existingItem) {
          const quantityDifference = item.quantity - existingItem.quantity;

          if (quantityDifference !== 0) {
            if (item.itemType === 'SALES_INVENTORY' && item.salesProductId) {
              await tx
                .update(salesProducts)
                .set({
                  currentStock: sql`${salesProducts.currentStock} + ${quantityDifference}`,
                })
                .where(eq(salesProducts.id, item.salesProductId));
            } else if (item.itemType === 'FIXED_ASSET' && item.fixedAssetId) {
              await tx
                .update(fixedAssets)
                .set({
                  currentStock: sql`${fixedAssets.currentStock} + ${quantityDifference}`,
                })
                .where(eq(fixedAssets.id, item.fixedAssetId));
            }
          }
        }

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
      });

      if (!result) {
        throw new NotFoundException(
          `Purchase order with ID '${id}' not found after update attempt.`,
        );
      }

      return {
        ...result,
        purchaseDate: new Date(result.purchaseDate),
        totalAmount: Number(result.totalAmount),
      } as PurchaseOrder;
    });
  }

  async remove(userId: number, id: number): Promise<PurchaseOrder> {
    return this.drizzle.transaction(async (tx) => {
      const purchaseOrder = await tx.query.purchaseOrders.findFirst({
        where: eq(purchaseOrders.id, id),
      });

      if (!purchaseOrder) {
        throw new NotFoundException(
          `Purchase order with ID '${id}' not found.`,
        );
      }

      if (purchaseOrder.status === invoiceSuppliersStatusEnum.CANCELLED) {
        throw new BadRequestException(
          `Purchase order with ID '${id}' is already cancelled.`,
        );
      }

      if (purchaseOrder.status === invoiceSuppliersStatusEnum.PAID) {
        throw new BadRequestException(
          `Cannot cancel a paid purchase order. A credit note must be issued.`,
        );
      }

      const findPurchaseOrderItem = await tx.query.purchaseItems.findMany({
        where: eq(purchaseItems.purchaseOrderId, purchaseOrder.id),
      });

      // Revert stock for items if the order is not cancelled yet
      for (const item of findPurchaseOrderItem) {
        if (item.itemType === 'SALES_INVENTORY' && item.salesProductId) {
          await tx
            .update(salesProducts)
            .set({
              currentStock: sql`${salesProducts.currentStock} - ${item.quantity}`,
            })
            .where(eq(salesProducts.id, item.salesProductId));
        } else if (item.itemType === 'FIXED_ASSET' && item.fixedAssetId) {
          await tx
            .update(fixedAssets)
            .set({
              currentStock: sql`${fixedAssets.currentStock} - ${item.quantity}`,
            })
            .where(eq(fixedAssets.id, item.fixedAssetId));
        }
      }

      const [updatedPurchaseOrder] = await tx
        .update(purchaseOrders)
        .set({
          status: invoiceSuppliersStatusEnum.CANCELLED,
          updatedById: userId,
        })
        .where(eq(purchaseOrders.id, id))
        .returning();

      if (!updatedPurchaseOrder) {
        throw new NotFoundException(
          `Purchase order with ID '${id}' not found after update attempt.`,
        );
      }

      const result = await tx.query.purchaseOrders.findFirst({
        where: eq(purchaseOrders.id, id),
      });

      if (!result) {
        throw new NotFoundException(
          `Purchase order with ID '${id}' not found after update attempt.`,
        );
      }

      return {
        ...result,
        purchaseDate: new Date(result.purchaseDate),
        totalAmount: Number(result.totalAmount),
      } as PurchaseOrder;
    });
  }
}
