import { PurchaseOrder } from '../schemas/purchase-order.schema';

export function mapPurchaseOrderApiToForm(data: any): PurchaseOrder {
  return {
    id: data.id,
    supplierId: data.supplierId,
    orderNumber: data.orderNumber,
    orderType: data.orderType,
    status: data.status,
    orderDate: new Date(data.orderDate),
    expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
    subtotal: data.subtotal,
    taxAmount: data.taxAmount,
    totalAmount: data.totalAmount,
    currencyCode: data.currencyCode,
    observations: data.observations,
    items: data.items.map((item: any) => ({
      id: item.id,
      lineType: item.lineType,
      itemName: item.itemName,
      description: item.description,
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalCost: item.totalCost,
      productId: item.productId,
      fixedAssetId: item.fixedAssetId,
      expenseAccountId: item.expenseAccountId,
    })),
  };
}
