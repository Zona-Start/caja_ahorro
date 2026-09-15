export interface PriceBreakdownInput {
  currencyCode: string;
  priceType: string;
  purchaseExchangeRate: number;
  salesExchangeRate: number;
  baseCost: number;
  otherCosts: number;
  purchaseTaxPercent: number;
  profitPercent: number;
  expensePercent: number;
  salesTaxPercent: number;
  salePrice?: number | null;
  offerSalePrice?: number | null;
  bsPriceAmount?: number | null;
}

export interface PriceBreakdown {
  totalCost: number;
  baseCostVes: number;
  otherCostsVes: number;
  totalCostVes: number;
  finalPriceNet: number;
  finalPriceGross: number;
  finalPriceNetVes: number;
  finalPriceGrossVes: number;
}

const round6 = (value: number): number => +value.toFixed(6);

/**
 * Fuente única de verdad para el desglose de precios bimonetario.
 *
 * Recibe las entradas nativas persistidas en `product_prices` y devuelve los
 * valores derivados (costos totales, espejo en VES y precios finales) SIN
 * persistir ninguna de estas columnas. Esta lógica es la que usan los servicios
 * de lectura y las pruebas unitarias.
 */
export function computePriceBreakdown(
  input: PriceBreakdownInput,
): PriceBreakdown {
  const {
    currencyCode,
    priceType,
    purchaseExchangeRate,
    salesExchangeRate,
    baseCost,
    otherCosts,
    purchaseTaxPercent,
    profitPercent,
    expensePercent,
    salesTaxPercent,
    salePrice,
    offerSalePrice,
    bsPriceAmount,
  } = input;

  // ── Bloque de Costos (moneda origen) ──
  const purchaseTaxAmount =
    (baseCost + otherCosts) * (purchaseTaxPercent / 100);
  const totalCost = baseCost + otherCosts + purchaseTaxAmount;

  // ── Espejo VES (tasa de compra) ──
  const baseCostVes = round6(baseCost * purchaseExchangeRate);
  const otherCostsVes = round6(otherCosts * purchaseExchangeRate);
  const totalCostVes = round6(totalCost * purchaseExchangeRate);

  // ── Bloque de Venta ──
  let finalPriceNet: number;
  let finalPriceGross: number;

  if (
    currencyCode !== 'VES' &&
    priceType === 'OFFER' &&
    (offerSalePrice ?? 0) > 0
  ) {
    // Precio oferta directo en divisa
    finalPriceGross = offerSalePrice!;
    finalPriceNet = round6(finalPriceGross / (1 + salesTaxPercent / 100));
  } else if (currencyCode !== 'VES' && (salePrice ?? 0) > 0) {
    // Precio directo en divisa (sin cálculo por margen de ganancia)
    finalPriceGross = salePrice!;
    finalPriceNet = round6(finalPriceGross / (1 + salesTaxPercent / 100));
  } else {
    const costPlusExpense = totalCost * (1 + expensePercent / 100);
    finalPriceNet = round6(costPlusExpense * (1 + profitPercent / 100));
    const salesTaxAmount = finalPriceNet * (salesTaxPercent / 100);
    finalPriceGross = round6(finalPriceNet + salesTaxAmount);
  }

  // ── Espejo VES (tasa de venta) ──
  const hasBsAmount = currencyCode !== 'VES' && (bsPriceAmount ?? 0) > 0;
  const vesMultiplier = hasBsAmount ? bsPriceAmount! : finalPriceGross;
  const finalPriceNetVes = round6(finalPriceNet * salesExchangeRate);
  const finalPriceGrossVes = round6(vesMultiplier * salesExchangeRate);

  return {
    totalCost: round6(totalCost),
    baseCostVes,
    otherCostsVes,
    totalCostVes,
    finalPriceNet: round6(finalPriceNet),
    finalPriceGross: round6(finalPriceGross),
    finalPriceNetVes,
    finalPriceGrossVes,
  };
}
