import { Product } from '../schemas/product.schema';

export function mapProductApiToForm(data: any): Product {
  return {
    id: data.id,
    categoryId: data.categoryId,
    sku: data.sku,
    name: data.name,
    description: data.description,
    brand: data.brand,
    model: data.model,
    stockMin: data.stockMin,
    stockMax: data.stockMax,
    reorderPoint: data.reorderPoint,
    status: data.status,
  };
}
