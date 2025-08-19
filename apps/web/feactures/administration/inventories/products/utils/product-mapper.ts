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
