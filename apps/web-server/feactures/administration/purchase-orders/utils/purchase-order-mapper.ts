export function mapPurchaseOrderApiToForm(data: any) {
  if (!data || data.length === 0) {
    // Devuelve una promesa resuelta con un array vacío.
    return Promise.resolve([]);
  }

  const mappedPurchaseOrders = data.map((item: any) => {
    // Agrega "T00:00:00" para forzar la interpretación de la fecha como local.
    const orderDateLocal = item.orderDate
      ? new Date(`${item.orderDate}T00:00:00`)
      : undefined;
    const expectedDeliveryDateLocal = item.expectedDeliveryDate
      ? new Date(`${item.expectedDeliveryDate}T00:00:00`)
      : undefined;
    return {
      id: item.id,
      supplierId: item.supplierId,
      supplierName: item.supplierName,
      orderNumber: item.orderNumber,
      status: item.status,
      orderDate: item?.orderDate?.split('T')[0],
      expectedDeliveryDate: expectedDeliveryDateLocal,
      subtotal: item.subtotal,
      taxAmount: item.taxAmount,
      totalAmount: item.totalAmount,
      currencyCode: item.currencyCode,
      observations: item.observations,
      itemsCount: item.items.length,
      items: item.items.map((payload: any) => ({
        id: payload.id,
        itemId: payload.itemId,
        lineType: payload.lineType,
        itemName: payload.itemName,
        description: payload.description,
        quantity: payload.quantity,
        unitCost: payload.unitCost,
        totalCost: payload.totalCost,
        productId: payload.productId,
        fixedAssetId: payload.fixedAssetId,
        serviceId: payload.serviceId,
        expenseAccountId: payload.expenseAccountId,
      })),
    };
  });

  // Devuelve una promesa resuelta con el array de órdenes de compra mapeadas.
  return mappedPurchaseOrders;
}
