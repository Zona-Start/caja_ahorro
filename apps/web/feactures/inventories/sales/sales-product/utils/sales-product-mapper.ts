import { SalesProduct } from '../schemas/sales-product.schema';

export function mapSalesProductApiToForm(data: any): SalesProduct {
  return {
    id: data.id,
    categoryId: data.categoryId,
    productCode: data.productCode,
    name: data.name,
    description: data.description,
    brand: data.brand,
    model: data.model,
    defaultPurchaseCost: data.defaultPurchaseCost,
    defaultSellingPrice: data.defaultSellingPrice,
    currentStock: data.currentStock,
    minimumStockAlert: data.minimumStockAlert,
    status: data.status,
  };
}