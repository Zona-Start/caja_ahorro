import { z } from 'zod';
import type { Product } from './products.schema';

export const COMMERCE_UNIT_MEASURES = [
  'UNIT',
  'KILOGRAM',
  'LITER',
  'METER',
  'BOX',
  'PACK',
] as const;

/**
 * Simplified product form for `EMPRESA_COMERCIAL`.
 *
 * Small businesses should not deal with cost breakdowns, margins, exchange
 * rates or taxes. This schema only exposes the handful of fields a shop owner
 * cares about. Everything else required by the backend is injected by
 * `toCommerceProductPayload`.
 */
export const commerceProductFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  categoryId: z.string().uuid('La categoría es requerida'),
  sku: z.string().max(50).optional(),
  description: z.string().optional(),
  unitOfMeasure: z.enum(COMMERCE_UNIT_MEASURES).default('UNIT'),
  /** Cost per unit paid to the supplier (without taxes). Optional. */
  supplierCost: z.coerce
    .number()
    .min(0, 'El costo no puede ser negativo')
    .default(0),
  /** Final sale price (tax included) the shop owner wants to charge. */
  salePrice: z.coerce
    .number()
    .positive('El precio de venta debe ser mayor a cero'),
  stockMin: z.coerce.number().int().min(0, 'El stock mínimo debe ser >= 0').default(0),
});

export type CommerceProductForm = z.infer<typeof commerceProductFormSchema>;

export interface CommerceProductContext {
  /** Default sales tax (%) from the tenant settings (`TAX_SALES`). */
  salesTaxPercent?: number;
  /** Default purchase tax (%) from the tenant settings (`TAX_PURCHASES`). */
  purchaseTaxPercent?: number;
  /** Fallback profit margin (%) when there is no cost to derive it from. */
  defaultProfitMargin?: number;
  currencyCode?: Product['currencyCode'];
}

const round = (value: number, decimals = 6): number =>
  Number(value.toFixed(decimals));

/**
 * Maps the simplified commerce form into the full product payload expected by
 * the NestJS `CreateProductSchema`, injecting every hidden/required field so
 * the request never fails with a 400.
 *
 * The backend computes the final sale price from `supplierCost`, taxes and
 * `profitSale` for VES products, so we derive the margin that yields the
 * desired `salePrice`:
 *
 *   finalNet   = salePrice / (1 + salesTaxPercent / 100)
 *   totalCost  = supplierCost * (1 + purchaseTaxPercent / 100)
 *   profitSale = (finalNet / totalCost - 1) * 100
 */
export function toCommerceProductPayload(
  form: CommerceProductForm,
  context: CommerceProductContext = {},
): Product {
  const salesTaxPercent = context.salesTaxPercent ?? 16;
  const purchaseTaxPercent = context.purchaseTaxPercent ?? 16;
  const defaultProfitMargin = context.defaultProfitMargin ?? 0;
  const currencyCode = context.currencyCode ?? 'VES';

  const totalCost = form.supplierCost * (1 + purchaseTaxPercent / 100);
  const finalNet = form.salePrice / (1 + salesTaxPercent / 100);
  const profitSale =
    totalCost > 0
      ? Math.max(0, round((finalNet / totalCost - 1) * 100, 2))
      : defaultProfitMargin;

  return {
    name: form.name,
    categoryId: form.categoryId,
    sku: form.sku,
    description: form.description,
    unitOfMeasure: form.unitOfMeasure,
    stockMin: form.stockMin,
    stockMax: 0,
    reorderPoint: 0,
    status: 'AVAILABLE',
    currencyCode,
    purchaseExchangeRate: 1,
    salesExchangeRate: 1,
    supplierCost: form.supplierCost,
    otherCosts: 0,
    purchaseTaxPercent,
    profitSale,
    expensePercent: 0,
    salesTaxPercent,
    suppliers: [],
  };
}

/**
 * Rehydrates the full product model into the simplified commerce form so the
 * edit flow keeps the price the shop owner originally entered.
 */
export function toCommerceFormValues(
  product: Partial<Product> | undefined,
): Partial<CommerceProductForm> {
  if (!product) return {};
  const cost = Number(product.supplierCost) || 0;
  const purchaseTax = Number(product.purchaseTaxPercent) || 0;
  const salesTax = Number(product.salesTaxPercent) || 0;
  const profit = Number(product.profitSale) || 0;
  const expense = Number(product.expensePercent) || 0;

  const totalCost = cost * (1 + purchaseTax / 100);
  const finalNet = totalCost * (1 + expense / 100) * (1 + profit / 100);
  const finalGross =
    product.salePrice != null && Number(product.salePrice) > 0
      ? Number(product.salePrice)
      : finalNet * (1 + salesTax / 100);

  return {
    name: product.name ?? '',
    categoryId: product.categoryId ?? '',
    sku: product.sku,
    description: product.description ?? undefined,
    unitOfMeasure: product.unitOfMeasure ?? 'UNIT',
    supplierCost: cost,
    salePrice: Number(finalGross.toFixed(2)),
    stockMin: product.stockMin ?? 0,
  };
}
