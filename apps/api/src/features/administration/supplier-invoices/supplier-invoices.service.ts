import {
  supplierInvoiceItems,
  supplierInvoices,
  suppliers,
} from '@/database/schema/administration';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { AccountsPayableService } from '../accounts-payable/accounts-payable.service';
import { FixedAssetPricesService } from '../inventory/fixed-asset-prices/fixed-asset-prices.service';
import { InventoryMovementsService } from '../inventory/inventory-movements/inventory-movements.service';
import { ProductPricesService } from '../inventory/product-prices/product-prices.service';
import { ServicePricesService } from '../inventory/services-prices/services-prices.service';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';
import { FilterSupplierInvoiceDto } from './dto/filter-supplier-invoice.dto';
import { UpdateSupplierInvoiceDto } from './dto/update-supplier-invoice.dto';

@Injectable()
export class SupplierInvoicesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly inventoryMovementsService: InventoryMovementsService,
    private readonly productPricesService: ProductPricesService,
    private readonly servicePricesService: ServicePricesService,
    private readonly fixedAssetPricesService: FixedAssetPricesService,
    private readonly purchaseOrdersService: PurchaseOrdersService,
    private readonly accountsPayableService: AccountsPayableService,
  ) {}

  async create(userId: number, data: CreateSupplierInvoiceDto) {
    const { items, subtotal, taxAmount, totalAmount, ...invoiceData } = data;

    return await this.drizzle.transaction(async (tx) => {
      // 1. Verify if the invoice already exists
      const existingInvoice = await tx.query.supplierInvoices.findFirst({
        where: and(
          eq(supplierInvoices.invoiceNumber, invoiceData.invoiceNumber),
          eq(supplierInvoices.supplierId, invoiceData.supplierId),
        ),
      });

      if (existingInvoice) {
        throw new ConflictException(
          'Invoice with this number and supplier already exists',
        );
      }

      const newInvoice = await tx
        .insert(supplierInvoices)
        .values({
          ...invoiceData,
          subtotal: subtotal.toString(),
          invoiceDate: invoiceData.invoiceDate.toISOString(),
          dueDate: invoiceData.dueDate?.toISOString(),
          taxAmount: taxAmount?.toString(),
          totalAmount: totalAmount.toString(),
          createdById: userId,
        })
        .returning();

      // 3. If purchaseOrderId is provided, update the purchase order as received
      if (invoiceData.purchaseOrderId) {
        await this.purchaseOrdersService.update(
          userId,
          invoiceData.purchaseOrderId,
          { status: 'RECEIVED' },
        );
      }

      if (items && items.length > 0) {
        const invoiceItems = items.map((item) => ({
          ...item,
          invoiceId: newInvoice[0].id,
          unitCost: item.unitCost.toString(),
          totalLine: item.totalLine.toString(),
          createdById: userId,
        }));
        await tx.insert(supplierInvoiceItems).values(invoiceItems as any);

        for (const item of items) {
          if (item.lineType === 'SALES_INVENTORY') {
            await this.inventoryMovementsService.create(
              userId,
              {
                items: [
                  {
                    itemId: item.itemId,
                    itemType: 'PRODUCT',
                    quantity: item.quantity,
                    unitCost: item.unitCost,
                  },
                ],
                description: `Compra de ${item.description}`,
                movementType: 'IN',
                documentType: 'FACTURA DEL PROVEEDOR',
                documentNumber: newInvoice[0].invoiceNumber,
              },
              tx,
            );

            await this.productPricesService.create(
              userId,
              {
                productId: item.itemId,
                suppliersId: newInvoice[0].supplierId,
                priceType: 'COST',
                baseCost: item.unitCost,
                otherCosts: 0,
                purchaseTax: 0,
                totalCost: item.unitCost,
                startDate: new Date(),
                isActive: true,
                expensePercent: 0,
                profitPercent: 0,
                salesTaxPercent: 0,
                finalPrice: item.unitCost,
              },
              tx,
            );
          } else if (item.lineType === 'FIXED_ASSET') {
            await this.inventoryMovementsService.create(
              userId,
              {
                items: [
                  {
                    itemId: item.itemId,
                    itemType: 'FIXED_ASSET',
                    quantity: item.quantity,
                    unitCost: item.unitCost,
                  },
                ],
                description: `Compra de ${item.description}`,
                movementType: 'IN',
                documentType: 'FACTURA DEL PROVEEDOR',
                documentNumber: newInvoice[0].invoiceNumber,
              },
              tx,
            );

            await this.fixedAssetPricesService.create(
              userId,
              {
                fixedAssetsId: item.itemId,
                suppliersId: newInvoice[0].supplierId,
                baseCost: item.unitCost,
                otherCosts: 0,
                purchaseTax: 0,
                totalCost: item.unitCost,
                startDate: new Date(),
                isActive: true,
              },
              tx,
            );
          } else if (item.lineType === 'SERVICE') {
            await this.servicePricesService.create(
              userId,
              {
                serviceId: item.itemId,
                suppliersId: newInvoice[0].supplierId,
                baseCost: item.unitCost,
                otherCosts: 0,
                purchaseTax: 0,
                totalCost: item.unitCost,
                startDate: new Date(),
                isActive: true,
              },
              tx,
            );
          }
        }
      }

      // 7. If the invoice payment method is credit, create an accounts payable entry
      if (newInvoice[0].paymentType === 'CREDIT') {
        await this.accountsPayableService.create(
          userId,
          {
            supplierInvoiceId: newInvoice[0].id,
            originalAmount: Number(newInvoice[0].totalAmount),
            paidAmount: 0,
            remainingAmount: Number(newInvoice[0].totalAmount),
            currencyCode: newInvoice[0].currencyCode,
            status: 'PENDING',
            observations: `Accounts payable for invoice ${newInvoice[0].invoiceNumber}`,
          },
          tx,
        );
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
      searchConditions.push(
        ilike(supplierInvoices.invoiceNumber, `%${search}%`),
      );
    }
    if (supplierId) {
      searchConditions.push(eq(supplierInvoices.supplierId, supplierId));
    }
    if (status) {
      searchConditions.push(eq(supplierInvoices.status, status as any));
    }
    if (startDate) {
      searchConditions.push(
        sql`${supplierInvoices.invoiceDate} >= ${startDate}`,
      );
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

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(supplierInvoices)
      .leftJoin(
        supplierInvoiceItems,
        eq(supplierInvoices.id, supplierInvoiceItems.invoiceId),
      )
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const rawData = await this.drizzle
      .select({
        invoice: supplierInvoices,
        item: supplierInvoiceItems,
        supplierName: suppliers.name,
      })
      .from(supplierInvoices)
      .leftJoin(suppliers, eq(supplierInvoices.supplierId, suppliers.id))
      .leftJoin(
        supplierInvoiceItems,
        eq(supplierInvoices.id, supplierInvoiceItems.invoiceId),
      )
      .limit(limit)
      .offset(offset)
      .where(searchCondition)
      .orderBy(orderBy);

    // 3. Agrupa los ítems por orden en el código
    const groupedData = new Map<number, any>();

    rawData.forEach((row) => {
      if (!groupedData.has(row.invoice.id)) {
        // Mapea la orden y convierte los strings a numbers según tu esquema Zod

        const invoice = {
          id: row.invoice.id,
          supplierId: row.invoice.supplierId,
          supplierName: row.supplierName,
          purchaseOrderId: row.invoice.purchaseOrderId,
          invoiceNumber: row.invoice.invoiceNumber,
          invoiceType: row.invoice.invoiceType,
          controlNumber: row.invoice.controlNumber,
          invoiceDate: row.invoice.invoiceDate,
          dueDate: row.invoice.dueDate,
          subtotal: Number(row.invoice.subtotal),
          taxAmount: Number(row.invoice.taxAmount),
          totalAmount: Number(row.invoice.totalAmount),
          paymentType: row.invoice.paymentType,
          status: row.invoice.status,
          observations: row.invoice.observations,
          items: [],
        };
        groupedData.set(row.invoice.id, invoice);
      }

      // Mapea y convierte el ítem si existe
      if (row.item) {
        const item = {
          id: row.item.id,
          lineType: row.item.lineType,
          description: row.item.description,
          expenseAccountId: row.item.expenseAccountId,
          itemId: row.item.itemId,
          quantity: Number(row.item.quantity),
          unitCost: Number(row.item.unitCost),
          totalLine: Number(row.item.totalLine),
        };
        groupedData.get(row.item.id).items.push(item);
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
    const { items, subtotal, taxAmount, totalAmount, ...invoiceData } = data;

    return await this.drizzle.transaction(async (tx) => {
      const existingInvoice = await tx.query.supplierInvoices.findFirst({
        where: eq(supplierInvoices.id, id),
        with: {
          items: true,
        },
      });

      if (!existingInvoice) {
        throw new NotFoundException('Supplier invoice not found');
      }

      // Update the main invoice
      const updatedInvoice = await tx
        .update(supplierInvoices)
        .set({
          ...invoiceData,
          invoiceDate: invoiceData.invoiceDate
            ? new Date(invoiceData.invoiceDate).toISOString()
            : new Date().toISOString(),
          dueDate: invoiceData.dueDate
            ? new Date(invoiceData.dueDate).toISOString()
            : new Date().toISOString(),
          subtotal: subtotal?.toString(),
          taxAmount: taxAmount?.toString(),
          totalAmount: totalAmount?.toString(),
          updatedById: userId,
        })
        .where(eq(supplierInvoices.id, id))
        .returning();

      const existingItems = existingInvoice.items || [];
      const newItems = items || [];

      // Determine items to add, update, and remove
      const itemsToRemove = existingItems.filter(
        (existingItem) =>
          !newItems.some((newItem) => newItem.id === existingItem.id),
      );
      const itemsToAdd = newItems.filter((newItem) => !newItem.id); // Items without an ID are new
      const itemsToUpdate = newItems.filter((newItem) => newItem.id); // Items with an ID are updates

      // Handle items to remove
      for (const item of itemsToRemove) {
        await tx
          .delete(supplierInvoiceItems)
          .where(eq(supplierInvoiceItems.id, item.id));

        if (item.lineType === 'SALES_INVENTORY') {
          await this.inventoryMovementsService.create(
            userId,
            {
              items: [
                {
                  itemId: item.itemId,
                  itemType: 'PRODUCT',
                  quantity: item.quantity,
                  unitCost: Number(item.unitCost),
                },
              ],
              description: `Reversal of purchase for ${item.description}`,
              movementType: 'OUT',
              documentType: 'REVERSIÓN DE FACTURA DE PROVEEDOR',
              documentNumber: existingInvoice.invoiceNumber,
            },
            tx,
          );
          const lastActivePrice =
            await this.productPricesService.findLastActivePriceByProductId(
              item.itemId,
            );
          if (lastActivePrice) {
            await this.productPricesService.deactivatePrice(
              lastActivePrice[0].id,
            );
          }
        } else if (item.lineType === 'FIXED_ASSET') {
          await this.inventoryMovementsService.create(
            userId,
            {
              items: [
                {
                  itemId: item.itemId,
                  itemType: 'FIXED_ASSET',
                  quantity: item.quantity,
                  unitCost: Number(item.unitCost),
                },
              ],
              description: `Reversal of purchase for ${item.description}`,
              movementType: 'OUT',
              documentType: 'SUPPLIER_INVOICE_REVERSAL',
              documentNumber: existingInvoice.invoiceNumber,
            },
            tx,
          );
          const lastActivePrice =
            await this.fixedAssetPricesService.findLastActivePriceByFixedAssetId(
              item.itemId,
            );
          if (lastActivePrice) {
            await this.fixedAssetPricesService.deactivatePrice(
              lastActivePrice.id,
            );
          }
        } else if (item.lineType === 'SERVICE') {
          const lastActivePrice =
            await this.servicePricesService.findLastActivePriceByServiceId(
              item.itemId,
            );
          if (lastActivePrice) {
            await this.servicePricesService.deactivatePrice(lastActivePrice.id);
          }
        }
      }

      // Handle items to add
      if (itemsToAdd.length > 0) {
        const invoiceItemsToInsert = itemsToAdd.map((item) => ({
          ...item,
          invoiceId: id,
          unitCost: item.unitCost.toString(),
          totalLine: item.totalLine.toString(),
          createdById: userId,
        }));
        await tx
          .insert(supplierInvoiceItems)
          .values(invoiceItemsToInsert as any);

        for (const item of itemsToAdd) {
          if (item.lineType === 'SALES_INVENTORY') {
            await this.inventoryMovementsService.create(
              userId,
              {
                items: [
                  {
                    itemId: item.itemId,
                    itemType: 'PRODUCT',
                    quantity: item.quantity,
                    unitCost: item.unitCost,
                  },
                ],
                description: `Purchase of ${item.description}`,
                movementType: 'RECEIVED',
                documentType: 'SUPPLIER_INVOICE',
                documentNumber: updatedInvoice[0].invoiceNumber,
              },
              tx,
            );
            await this.productPricesService.create(
              userId,
              {
                productId: item.itemId,
                suppliersId: updatedInvoice[0].supplierId,
                priceType: 'COST',
                baseCost: item.unitCost,
                otherCosts: 0,
                purchaseTax: 0,
                totalCost: item.unitCost,
                expensePercent: 0,
                profitPercent: 0,
                salesTaxPercent: 0,
                finalPrice: item.unitCost,
                startDate: new Date(),
                isActive: true,
              },
              tx,
            );
          } else if (item.lineType === 'FIXED_ASSET') {
            await this.inventoryMovementsService.create(
              userId,
              {
                items: [
                  {
                    itemId: item.itemId,
                    itemType: 'FIXED_ASSET',
                    quantity: item.quantity,
                    unitCost: item.unitCost,
                  },
                ],
                description: `Purchase of ${item.description}`,
                movementType: 'RECEIVED',
                documentType: 'SUPPLIER_INVOICE',
                documentNumber: updatedInvoice[0].invoiceNumber,
              },
              tx,
            );
            await this.fixedAssetPricesService.create(
              userId,
              {
                fixedAssetsId: item.itemId,
                suppliersId: updatedInvoice[0].supplierId,
                baseCost: item.unitCost,
                otherCosts: 0,
                purchaseTax: 0,
                totalCost: item.unitCost,
                startDate: new Date(),
                isActive: true,
              },
              tx,
            );
          } else if (item.lineType === 'SERVICE') {
            await this.servicePricesService.create(
              userId,
              {
                serviceId: item.itemId,
                suppliersId: updatedInvoice[0].supplierId,
                baseCost: item.unitCost,
                otherCosts: 0,
                purchaseTax: 0,
                totalCost: item.unitCost,
                startDate: new Date(),
                isActive: true,
              },
              tx,
            );
          }
        }
      }

      // Handle items to update
      for (const newItem of itemsToUpdate) {
        const existingItem = existingItems.find(
          (item) => item.id === newItem.id,
        );

        if (existingItem) {
          // Update item details
          await tx
            .update(supplierInvoiceItems)
            .set({
              description: newItem.description,
              quantity: newItem.quantity,
              unitCost: newItem.unitCost.toString(),
              totalLine: newItem.totalLine.toString(),
              updatedById: userId,
            })
            .where(eq(supplierInvoiceItems.id, newItem.id));

          // Handle inventory movements and price updates for updated items
          if (
            newItem.lineType === 'SALES_INVENTORY' ||
            newItem.lineType === 'FIXED_ASSET'
          ) {
            const oldQuantity = existingItem.quantity;
            const newQuantity = newItem.quantity;
            const quantityDiff = newQuantity - oldQuantity;

            if (quantityDiff !== 0) {
              await this.inventoryMovementsService.create(
                userId,
                {
                  items: [
                    {
                      itemId: newItem.itemId,
                      itemType: newItem.lineType as 'PRODUCT' | 'FIXED_ASSET',
                      quantity: Math.abs(quantityDiff),
                      unitCost: newItem.unitCost,
                    },
                  ],
                  description: `Quantity adjustment for ${newItem.description}`,
                  movementType: quantityDiff > 0 ? 'ADJUST_IN' : 'ADJUST_OUT',
                  documentType: 'SUPPLIER_INVOICE_ADJUSTMENT',
                  documentNumber: updatedInvoice[0].invoiceNumber,
                },
                tx,
              );
            }

            if (Number(existingItem.unitCost) !== newItem.unitCost) {
              if (newItem.lineType === 'SALES_INVENTORY') {
                const lastActivePrice =
                  await this.productPricesService.findLastActivePriceByProductId(
                    newItem.itemId,
                  );
                if (lastActivePrice) {
                  await this.productPricesService.deactivatePrice(
                    lastActivePrice[0].id,
                  );
                }
                await this.productPricesService.create(
                  userId,
                  {
                    productId: newItem.itemId,
                    suppliersId: updatedInvoice[0].supplierId,
                    priceType: 'COST',
                    baseCost: newItem.unitCost,
                    otherCosts: 0,
                    purchaseTax: 0,
                    totalCost: newItem.unitCost,
                    expensePercent: 0,
                    profitPercent: 0,
                    salesTaxPercent: 0,
                    finalPrice: newItem.unitCost,
                    startDate: new Date(),
                    isActive: true,
                  },
                  tx,
                );
              } else if (newItem.lineType === 'FIXED_ASSET') {
                const lastActivePrice =
                  await this.fixedAssetPricesService.findLastActivePriceByFixedAssetId(
                    newItem.itemId,
                  );
                if (lastActivePrice) {
                  await this.fixedAssetPricesService.deactivatePrice(
                    lastActivePrice.id,
                  );
                }
                await this.fixedAssetPricesService.create(
                  userId,
                  {
                    fixedAssetsId: newItem.itemId,
                    suppliersId: updatedInvoice[0].supplierId,
                    baseCost: newItem.unitCost,
                    otherCosts: 0,
                    purchaseTax: 0,
                    totalCost: newItem.unitCost,
                    startDate: new Date(),
                    isActive: true,
                  },
                  tx,
                );
              }
            }
          } else if (newItem.lineType === 'SERVICE') {
            if (Number(existingItem.unitCost) !== newItem.unitCost) {
              const lastActivePrice =
                await this.servicePricesService.findLastActivePriceByServiceId(
                  newItem.itemId,
                );
              if (lastActivePrice) {
                await this.servicePricesService.deactivatePrice(
                  lastActivePrice.id,
                );
              }
              await this.servicePricesService.create(
                userId,
                {
                  serviceId: newItem.itemId,
                  suppliersId: updatedInvoice[0].supplierId,
                  baseCost: newItem.unitCost,
                  otherCosts: 0,
                  purchaseTax: 0,
                  totalCost: newItem.unitCost,
                  startDate: new Date(),
                  isActive: true,
                },
                tx,
              );
            }
          }
        }
      }

      return updatedInvoice[0];
    });
  }

  async remove(id: number) {
    return await this.drizzle.transaction(async (tx) => {
      const existingInvoice = await tx.query.supplierInvoices.findFirst({
        where: eq(supplierInvoices.id, id),
        with: {
          items: true,
        },
      });

      if (!existingInvoice) {
        throw new NotFoundException('Supplier invoice not found');
      }

      for (const item of existingInvoice.items) {
        if (item.lineType === 'PRODUCT') {
          await this.inventoryMovementsService.create(
            existingInvoice.createdById ?? 0,
            {
              items: [
                {
                  itemId: item.itemId,
                  itemType: 'PRODUCT',
                  quantity: item.quantity,
                  unitCost: Number(item.unitCost),
                },
              ],
              description: `Reversal of purchase for ${item.description}`,
              movementType: 'OUT',
              documentType: 'SUPPLIER_INVOICE_REVERSAL',
              documentNumber: existingInvoice.invoiceNumber,
            },
            tx,
          );
          const lastActivePrice =
            await this.productPricesService.findLastActivePriceByProductId(
              item.itemId,
            );
          if (lastActivePrice) {
            await this.productPricesService.deactivatePrice(
              lastActivePrice[0].id,
            );
          }
        } else if (item.lineType === 'FIXED_ASSET') {
          await this.inventoryMovementsService.create(
            existingInvoice.createdById ?? 0,
            {
              items: [
                {
                  itemId: item.itemId,
                  itemType: 'FIXED_ASSET',
                  quantity: item.quantity,
                  unitCost: Number(item.unitCost),
                },
              ],
              description: `Reversal of purchase for ${item.description}`,
              movementType: 'OUT',
              documentType: 'SUPPLIER_INVOICE_REVERSAL',
              documentNumber: existingInvoice.invoiceNumber,
            },
            tx,
          );
          const lastActivePrice =
            await this.fixedAssetPricesService.findLastActivePriceByFixedAssetId(
              item.itemId,
            );
          if (lastActivePrice) {
            await this.fixedAssetPricesService.deactivatePrice(
              lastActivePrice.id,
            );
          }
        } else if (item.lineType === 'SERVICE') {
          const lastActivePrice =
            await this.servicePricesService.findLastActivePriceByServiceId(
              item.itemId,
            );
          if (lastActivePrice) {
            await this.servicePricesService.deactivatePrice(lastActivePrice.id);
          }
        }
      }

      await tx
        .delete(supplierInvoiceItems)
        .where(eq(supplierInvoiceItems.invoiceId, id));
      await tx.delete(supplierInvoices).where(eq(supplierInvoices.id, id));
      return { message: 'Supplier invoice removed successfully' };
    });
  }
}
