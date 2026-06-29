import { apiClient } from '@/lib/api-client';
import {
  productApiResponseSchema,
  productCreateResponseSchema,
  productDeleteResponseSchema,
  productListApiResponseSchema,
  productViewApiResponseSchema,
  type ProductViewResponse,
} from '../schemas/products-api.schema';
import type { Product } from '../schemas/products.schema';

function toNum(value: string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function mapViewToProduct(view: ProductViewResponse): Product {
  const dp = view.dataProduct;
  const sellingPrice = view.dataProductPrices?.find((p) => p.priceType === 'SELLING') ?? null;
  const offerPrice = view.dataProductPrices?.find((p) => p.priceType === 'OFFER') ?? null;

  return {
    id: dp.id,
    internalCode: dp.internalCode ?? undefined,
    name: dp.name,
    description: dp.description ?? '',
    categoryId: dp.categoryId ?? undefined,
    brand: dp.brand ?? '',
    model: dp.model ?? '',
    sku: dp.sku ?? '',
    stockMin: dp.stockMin ?? 0,
    stockMax: dp.stockMax ?? 0,
    reorderPoint: dp.reorderPoint ?? 0,
    status: dp.status as Product['status'],
    unitOfMeasure: (dp.unitOfMeasure as Product['unitOfMeasure']) ?? 'UNIT',
    currencyCode: (sellingPrice?.currencyCode as Product['currencyCode']) ?? 'VES',
    purchaseExchangeRate: sellingPrice?.purchaseExchangeRate != null ? toNum(sellingPrice.purchaseExchangeRate) : 1,
    salesExchangeRate: sellingPrice?.salesExchangeRate != null ? toNum(sellingPrice.salesExchangeRate) : 1,
    supplierCost: toNum(sellingPrice?.baseCost),
    otherCosts: toNum(sellingPrice?.otherCosts),
    purchaseTaxPercent: sellingPrice?.purchaseTaxPercent != null ? toNum(sellingPrice.purchaseTaxPercent) : 16,
    profitSale: toNum(sellingPrice?.profitPercent),
    expensePercent: toNum(sellingPrice?.expensePercent),
    salesTaxPercent: sellingPrice?.salesTaxPercent != null ? toNum(sellingPrice.salesTaxPercent) : 16,
    salePrice: toNum(sellingPrice?.salePrice) || toNum(sellingPrice?.finalPriceGross) || undefined,
    bsPriceAmount: toNum(sellingPrice?.bsPriceAmount) || undefined,
    profitSupply: toNum(offerPrice?.profitPercent) || undefined,
    offerSalePrice: toNum(offerPrice?.offerSalePrice) || toNum(offerPrice?.finalPriceGross) || undefined,
    offerStartDate: offerPrice?.startDate ?? undefined,
    offerEndDate: offerPrice?.endDate ?? undefined,
    suppliers: [],
  };
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: string;
}

export interface PaginatedProductsResponse {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean | null;
    hasPreviousPage: boolean | null;
    nextPage: number | null;
    previousPage: number | null;
  };
}

export class ProductsService {
  static async getAll() {
    const response = await apiClient.get('/inventory/products/all');
    return productListApiResponseSchema.parse(response.data).data;
  }

  static async getPaginated(
    params: ProductQueryParams,
  ): Promise<PaginatedProductsResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('page', (params.page || 1).toString());
    searchParams.append('limit', (params.limit || 10).toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.categoryId) searchParams.append('categoryId', params.categoryId);

    const response = await apiClient.get(
      `/inventory/products/paginated?${searchParams.toString()}`,
    );

    if (!response.data) {
      return {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          totalCount: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          nextPage: null,
          previousPage: null,
        },
      };
    }

    let parsed;
    try {
      parsed = productListApiResponseSchema.parse(response.data);
    } catch {
      return {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          totalCount: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          nextPage: null,
          previousPage: null,
        },
      };
    }

    const m = parsed.meta ?? {
      page: 1,
      limit: 10,
      totalCount: 0,
      totalPages: 1,
      hasNextPage: false as const,
      hasPreviousPage: false as const,
      nextPage: null,
      previousPage: null,
    };
    return {
      data: parsed.data,
      meta: {
        page: m.page,
        limit: m.limit,
        totalCount: m.totalCount,
        totalPages: m.totalPages,
        hasNextPage: m.hasNextPage ?? null,
        hasPreviousPage: m.hasPreviousPage ?? null,
        nextPage: m.nextPage ?? null,
        previousPage: m.previousPage ?? null,
      },
    };
  }

  static async getById(id: string): Promise<Product> {
    const response = await apiClient.get(`/inventory/products/${id}`);
    const raw = productViewApiResponseSchema.parse(response.data);
    return mapViewToProduct(raw);
  }

  static async create(payload: Product) {
    const { id, ...body } = payload;
    const response = await apiClient.post('/inventory/products', body);
    return productCreateResponseSchema.parse(response.data);
  }

  static async update(payload: Product) {
    const { id, ...body } = payload;
    const response = await apiClient.patch(`/inventory/products/${id}`, body);
    return productCreateResponseSchema.parse(response.data);
  }

  static async delete(id: string) {
    const response = await apiClient.delete(`/inventory/products/${id}`);
    return productDeleteResponseSchema.parse(response.data);
  }

  static async getDefaults(): Promise<{
    taxPurchases: number;
    taxSales: number;
    utilityProduct: number;
    expenditureProduct: number;
  }> {
    const response = await apiClient.get('/inventory/products/defaults');
    return response.data;
  }
}
