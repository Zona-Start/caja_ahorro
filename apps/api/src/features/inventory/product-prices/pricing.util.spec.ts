import {
  computePriceBreakdown,
  type PriceBreakdownInput,
} from './pricing.util';

describe('computePriceBreakdown', () => {
  const baseInput: PriceBreakdownInput = {
    currencyCode: 'VES',
    priceType: 'SELLING',
    purchaseExchangeRate: 1,
    salesExchangeRate: 1,
    baseCost: 100,
    otherCosts: 10,
    purchaseTaxPercent: 16,
    profitPercent: 10,
    expensePercent: 5,
    salesTaxPercent: 16,
    salePrice: null,
    offerSalePrice: null,
    bsPriceAmount: null,
  };

  it('calcula el desglose en moneda base (VES) por margen de ganancia', () => {
    const result = computePriceBreakdown(baseInput);

    // Costos
    expect(result.totalCost).toBeCloseTo(127.6, 6);
    expect(result.baseCostVes).toBeCloseTo(100, 6);
    expect(result.otherCostsVes).toBeCloseTo(10, 6);
    expect(result.totalCostVes).toBeCloseTo(127.6, 6);

    // Precio final = costo*(1+gastos)*(1+utilidad)*(1+IVA)
    expect(result.finalPriceNet).toBeCloseTo(147.378, 6);
    expect(result.finalPriceGross).toBeCloseTo(170.95848, 6);
    expect(result.finalPriceNetVes).toBeCloseTo(147.378, 6);
    expect(result.finalPriceGrossVes).toBeCloseTo(170.95848, 6);
  });

  it('usa precio directo en divisa cuando salePrice > 0 (sin margen)', () => {
    const result = computePriceBreakdown({
      ...baseInput,
      currencyCode: 'USD',
      purchaseExchangeRate: 10,
      salesExchangeRate: 10,
      baseCost: 10,
      otherCosts: 0,
      purchaseTaxPercent: 0,
      profitPercent: 0,
      expensePercent: 0,
      salePrice: 50,
    });

    expect(result.totalCost).toBeCloseTo(10, 6);
    expect(result.baseCostVes).toBeCloseTo(100, 6);
    expect(result.totalCostVes).toBeCloseTo(100, 6);

    // Precio directo en divisa: gross = salePrice, net = gross / (1 + IVA)
    expect(result.finalPriceGross).toBeCloseTo(50, 6);
    expect(result.finalPriceNet).toBeCloseTo(43.103448, 6);
    expect(result.finalPriceNetVes).toBeCloseTo(431.03448, 6);
    expect(result.finalPriceGrossVes).toBeCloseTo(500, 6);
  });

  it('prioriza el precio de oferta directo en divisa sobre el precio regular', () => {
    const result = computePriceBreakdown({
      ...baseInput,
      currencyCode: 'USD',
      priceType: 'OFFER',
      purchaseExchangeRate: 10,
      salesExchangeRate: 10,
      baseCost: 10,
      otherCosts: 0,
      purchaseTaxPercent: 0,
      profitPercent: 0,
      expensePercent: 0,
      salePrice: 50,
      offerSalePrice: 45,
    });

    expect(result.finalPriceGross).toBeCloseTo(45, 6);
    expect(result.finalPriceNet).toBeCloseTo(38.793103, 6);
    expect(result.finalPriceNetVes).toBeCloseTo(387.93103, 6);
    expect(result.finalPriceGrossVes).toBeCloseTo(450, 6);
  });

  it('usa bsPriceAmount como multiplicador VES cuando está presente', () => {
    const result = computePriceBreakdown({
      ...baseInput,
      currencyCode: 'USD',
      purchaseExchangeRate: 10,
      salesExchangeRate: 10,
      baseCost: 10,
      otherCosts: 0,
      purchaseTaxPercent: 0,
      profitPercent: 0,
      expensePercent: 0,
      salePrice: 50,
      bsPriceAmount: 40,
    });

    expect(result.finalPriceGross).toBeCloseTo(50, 6);
    expect(result.finalPriceGrossVes).toBeCloseTo(400, 6);
    expect(result.finalPriceNetVes).toBeCloseTo(431.03448, 6);
  });

  it('calcula la oferta VES por margen (sin precio directo)', () => {
    const result = computePriceBreakdown({
      ...baseInput,
      priceType: 'OFFER',
      profitPercent: 5,
    });

    expect(result.totalCost).toBeCloseTo(127.6, 6);
    expect(result.finalPriceNet).toBeCloseTo(140.679, 6);
    expect(result.finalPriceGross).toBeCloseTo(163.18764, 6);
  });

  it('maneja costos en cero (producto sin costo registrado)', () => {
    const result = computePriceBreakdown({
      ...baseInput,
      baseCost: 0,
      otherCosts: 0,
      profitPercent: 0,
      expensePercent: 0,
      salesTaxPercent: 16,
    });

    expect(result.totalCost).toBeCloseTo(0, 6);
    expect(result.finalPriceNet).toBeCloseTo(0, 6);
    expect(result.finalPriceGross).toBeCloseTo(0, 6);
  });
});
