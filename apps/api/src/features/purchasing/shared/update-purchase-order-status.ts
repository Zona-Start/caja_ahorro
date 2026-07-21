import * as schema from '@/database/schema';
import {
  inventoryMovementItems,
  inventoryMovements,
  purchaseOrderItems,
  purchaseOrders,
  supplierInvoiceItems,
  supplierInvoices,
} from '@/database/schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { and, eq, ne, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Recalcula y actualiza las cantidades recibidas/facturadas en las líneas de la OC
 * y ajusta el estatus general de la Orden de Compra.
 */
export async function updatePurchaseOrderStatus(
  purchaseOrderId: string,
  tx: NodePgDatabase<typeof schema>,
) {
  // 1. Obtener las líneas originales de la Orden de Compra
  const poItems = await tx
    .select({
      id: purchaseOrderItems.id,
      productId: purchaseOrderItems.productId,
      itemId: purchaseOrderItems.itemId,
      lineType: purchaseOrderItems.lineType,
      description: purchaseOrderItems.description,
      quantity: purchaseOrderItems.quantity,
    })
    .from(purchaseOrderItems)
    .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));

  if (poItems.length === 0) {
    throw new NotFoundException('Orden de compra no encontrada o sin ítems.');
  }

  // 2. Agrupar y sumar Cantidades Recibidas por purchase_order_item_id desde los Movimientos de Inventario (no cancelados)
  const receivedSummary = await tx
    .select({
      purchaseOrderItemId: inventoryMovementItems.purchaseOrderItemId,
      totalReceived: sql<string>`COALESCE(SUM(${inventoryMovementItems.quantity}), '0')`,
    })
    .from(inventoryMovementItems)
    .innerJoin(
      inventoryMovements,
      eq(inventoryMovementItems.movementId, inventoryMovements.id),
    )
    .where(
      and(
        eq(inventoryMovements.purchaseOrderId, purchaseOrderId),
        ne(inventoryMovements.status, 'cancelled'),
      ),
    )
    .groupBy(inventoryMovementItems.purchaseOrderItemId);

  const receivedMap = new Map<string, number>();
  for (const item of receivedSummary) {
    if (item.purchaseOrderItemId) {
      receivedMap.set(item.purchaseOrderItemId, Number(item.totalReceived));
    }
  }

  // 3. Agrupar y sumar Cantidades Facturadas desde Facturas de Proveedores (no canceladas)
  const invoicedSummary = await tx
    .select({
      productId: supplierInvoiceItems.productId,
      itemId: supplierInvoiceItems.itemId,
      lineType: supplierInvoiceItems.lineType,
      description: supplierInvoiceItems.description,
      totalInvoiced: sql<string>`COALESCE(SUM(${supplierInvoiceItems.quantity}), '0')`,
    })
    .from(supplierInvoiceItems)
    .innerJoin(
      supplierInvoices,
      eq(supplierInvoiceItems.invoiceId, supplierInvoices.id),
    )
    .where(
      and(
        eq(supplierInvoices.purchaseOrderId, purchaseOrderId),
        ne(supplierInvoices.status, 'CANCELLED'),
      ),
    )
    .groupBy(
      supplierInvoiceItems.productId,
      supplierInvoiceItems.itemId,
      supplierInvoiceItems.lineType,
      supplierInvoiceItems.description,
    );

  const getUniqueKey = (item: {
    productId: string | null;
    itemId: string | null;
    lineType: string;
    description: string | null;
  }): string => {
    if (item.lineType === 'EXPENSE') {
      if (!item.description) {
        throw new BadRequestException('El gasto debe contener una descripción.');
      }
      return `${item.lineType}-${item.description.trim()}`;
    }

    const id = item.productId || item.itemId;
    if (!id) {
      throw new BadRequestException(
        `Ítem '${item.lineType}' no tiene productId ni itemId válido.`,
      );
    }
    return `${item.lineType}-${id}`;
  };

  const invoicedMap = new Map<string, number>();
  for (const item of invoicedSummary) {
    const key = getUniqueKey(item);
    const currentQty = invoicedMap.get(key) || 0;
    invoicedMap.set(key, currentQty + Number(item.totalInvoiced));
  }

  // 4. Evaluar estados línea por línea y actualizar contadores
  let isFullyReceived = true;
  let isPartiallyReceived = false;
  let isFullyInvoiced = true;

  for (const poItem of poItems) {
    const poQty = Number(poItem.quantity);
    const qtyReceived = receivedMap.get(poItem.id) || 0;
    const key = getUniqueKey({
      productId: poItem.productId,
      itemId: poItem.itemId,
      lineType: poItem.lineType,
      description: poItem.description,
    });
    const qtyInvoiced = invoicedMap.get(key) || 0;

    if (qtyReceived > poQty) {
      throw new BadRequestException(
        `La cantidad recibida (${qtyReceived}) supera la pedida (${poQty}) para el ítem.`,
      );
    }
    if (qtyInvoiced > poQty) {
      throw new BadRequestException(
        `La cantidad facturada (${qtyInvoiced}) supera la pedida (${poQty}) para el ítem.`,
      );
    }

    await tx
      .update(purchaseOrderItems)
      .set({
        quantityReceived: qtyReceived.toFixed(4),
        quantityInvoiced: qtyInvoiced.toFixed(4),
      })
      .where(eq(purchaseOrderItems.id, poItem.id));

    if (qtyReceived < poQty) isFullyReceived = false;
    if (qtyReceived > 0) isPartiallyReceived = true;
    if (qtyInvoiced < poQty) isFullyInvoiced = false;
  }

  // 5. Determinar el estatus definitivo
  let newStatus: 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CLOSED';

  if (isFullyReceived && isFullyInvoiced) {
    newStatus = 'CLOSED';
  } else if (isFullyReceived) {
    newStatus = 'RECEIVED';
  } else if (isPartiallyReceived) {
    newStatus = 'PARTIALLY_RECEIVED';
  } else {
    newStatus = 'APPROVED';
  }

  await tx
    .update(purchaseOrders)
    .set({ status: newStatus })
    .where(eq(purchaseOrders.id, purchaseOrderId));

  return newStatus;
}
