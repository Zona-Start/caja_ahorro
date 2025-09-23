import { GetProductPrice } from '../schemas/product-api.schema';
import { Product } from '../schemas/product.schema';

export function mapProductApiToForm(data: any): Partial<Product> {
  const { dataProduct, dataProductPrices } = data;

  const formValues: Partial<Product> = {
    id: dataProduct.id,
    categoryId: dataProduct.categoryId,
    name: dataProduct.name,
    description: dataProduct.description,
    brand: dataProduct.brand,
    model: dataProduct.model,
    stockMin: dataProduct.stockMin,
    stockMax: dataProduct.stockMax,
    reorderPoint: dataProduct.reorderPoint,
    status: dataProduct.status,
    unitType: dataProduct.unitType,
    sku: dataProduct.sku,
    categoryName: dataProduct.categoryName,
  };

  if (dataProductPrices && dataProductPrices.length > 0) {
    const sellingPrice = dataProductPrices.find(
      (p: GetProductPrice) => p.priceType === 'SELLING',
    );
    const offerPrice = dataProductPrices.find(
      (p: GetProductPrice) => p.priceType === 'OFFER',
    );

    const basePriceInfo = sellingPrice || offerPrice;

    if (basePriceInfo) {
      formValues.baseCost = parseFloat(basePriceInfo.baseCost ?? '0');
      formValues.otherCosts = parseFloat(basePriceInfo.otherCosts ?? '0');
      formValues.purchaseTax = parseFloat(basePriceInfo.purchaseTax ?? '0');
      formValues.saleTax = parseFloat(basePriceInfo.salesTaxPercent ?? '0');
    }

    if (sellingPrice) {
      formValues.profitSale = parseFloat(sellingPrice.profitPercent ?? '0');
    }

    if (offerPrice) {
      formValues.profitSupply = parseFloat(offerPrice.profitPercent ?? '0');
    }
  }

  return formValues;
}

export interface ProductDetails {
  id?: number | null;
  categoryId: number;
  categoryName?: string | null;
  sku?: string | null;
  name: string;
  description?: string | null;
  brand: string;
  model: string;
  status?: string;
  unitType: 'UNIT' | 'KILOGRAM' | 'LITER' | 'METER' | 'BOX' | 'PACK';
  purchaseTax?: number;
  saleTax?: number;
  baseCost: number;
  otherCosts: number;
  stockMin: number;
  stockMax: number;
  reorderPoint: number;
  profitSale: number;
  profitSupply: number;
  totalCost?: string | null;
  expensePercent?: string | null;
  profitPercent?: string | null;
  salesTaxPercent?: string | null;
  available: number | null;
}

export function mapProductApiToDetails(data: any): Partial<Product> {
  const { dataProduct, dataProductPrices, dataAvailable } = data;

  const formValues: Partial<ProductDetails> = {
    id: dataProduct.id,
    categoryId: dataProduct.categoryId,
    name: dataProduct.name,
    description: dataProduct.description,
    brand: dataProduct.brand,
    model: dataProduct.model,
    stockMin: dataProduct.stockMin,
    stockMax: dataProduct.stockMax,
    reorderPoint: dataProduct.reorderPoint,
    status: dataProduct.status,
    unitType: dataProduct.unitType,
    sku: dataProduct.sku,
    categoryName: dataProduct.categoryName,
    available: dataAvailable !== null ? dataAvailable.availableQuantity : 0,
  };

  if (dataProductPrices && dataProductPrices.length > 0) {
    const sellingPrice = dataProductPrices.find(
      (p: GetProductPrice) => p.priceType === 'SELLING',
    );
    const offerPrice = dataProductPrices.find(
      (p: GetProductPrice) => p.priceType === 'OFFER',
    );

    const basePriceInfo = sellingPrice || offerPrice;

    if (basePriceInfo) {
      formValues.baseCost = parseFloat(basePriceInfo.baseCost ?? '0');
      formValues.otherCosts = parseFloat(basePriceInfo.otherCosts ?? '0');
      formValues.purchaseTax = parseFloat(basePriceInfo.purchaseTax ?? '0');
      formValues.saleTax = parseFloat(basePriceInfo.salesTaxPercent ?? '0');
    }

    if (sellingPrice) {
      formValues.profitSale = parseFloat(sellingPrice.profitPercent ?? '0');
    }

    if (offerPrice) {
      formValues.profitSupply = parseFloat(offerPrice.profitPercent ?? '0');
    }
  }

  return formValues;
}
