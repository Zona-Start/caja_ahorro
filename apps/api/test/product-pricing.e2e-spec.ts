import { Pool } from 'pg';
import { computePriceBreakdown } from '../src/features/inventory/product-prices/pricing.util';

/**
 * Integración (PostgreSQL real) para verificar la refactorización del esquema
 * de precios:
 *  1. La tabla `product_prices` ya NO persiste columnas derivadas/espejo.
 *  2. Insertando solo la información nativa se calculan los importes derivados
 *     al vuelo mediante `computePriceBreakdown`.
 *
 * Requiere una base migrada (DATABASE_URL). Crea y limpia sus propios fixtures.
 */

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://postgres:local**@localhost:5432/caja_ahorro?options=-c%20search_path=auth,core,tenant,accounting,savings,inventory,purchasing,treasury,audit,public';

const DERIVED_COLUMNS = [
  'total_cost',
  'base_cost_ves',
  'other_costs_ves',
  'total_cost_ves',
  'final_price_net',
  'final_price_gross',
  'final_price_net_ves',
  'final_price_gross_ves',
  'final_price',
];

describe('Product pricing refactor (e2e)', () => {
  const pool = new Pool({ connectionString, max: 4 });
  const ts = Date.now();
  const tenantId = '00000000-0000-0000-0000-000000000002';
  let categoryId: string;
  let productId: string;
  let priceId: string;

  beforeAll(async () => {
    await pool.query(
      `INSERT INTO tenant.tenants (id, name, rif, email) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
      [tenantId, 'Pricing Test', `J-${ts}`, `pricing-${ts}@test.com`],
    );

    const catRes = await pool.query(
      `INSERT INTO inventory.inventories_categories (tenant_id, "group", name) VALUES ($1,$2,$3) RETURNING id`,
      [tenantId, 'Pricing', `PriceCat-${ts}`],
    );
    categoryId = catRes.rows[0].id;

    const prodRes = await pool.query(
      `INSERT INTO inventory.products
        (tenant_id, category_id, internal_code, sku, name, status)
       VALUES ($1,$2,$3,$4,$5,'AVAILABLE') RETURNING id`,
      [tenantId, categoryId, `PR-${ts}`, `PSKU-${ts}`, 'Producto Pricing'],
    );
    productId = prodRes.rows[0].id;
  }, 20000);

  afterAll(async () => {
    try {
      if (priceId) {
        await pool.query(`DELETE FROM inventory.product_prices WHERE id=$1`, [
          priceId,
        ]);
      }
      await pool.query(`DELETE FROM inventory.products WHERE id=$1`, [
        productId,
      ]);
      await pool.query(
        `DELETE FROM inventory.inventories_categories WHERE id=$1`,
        [categoryId],
      );
      await pool.query(`DELETE FROM tenant.tenants WHERE id=$1`, [tenantId]);
    } finally {
      await pool.end();
    }
  }, 20000);

  it('la tabla product_prices no contiene las columnas derivadas/espejo', async () => {
    const res = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema='inventory' AND table_name='product_prices'`,
    );
    const columns = res.rows.map((r) => r.column_name);

    for (const col of DERIVED_COLUMNS) {
      expect(columns).not.toContain(col);
    }

    // Conserva la información nativa y los parámetros de negocio.
    expect(columns).toContain('base_cost');
    expect(columns).toContain('currency_code');
    expect(columns).toContain('purchase_exchange_rate');
    expect(columns).toContain('sales_exchange_rate');
    expect(columns).toContain('profit_percent');
    expect(columns).toContain('sales_tax_percent');
  });

  it('inserta solo entradas nativas y calcula los importes derivados al vuelo', async () => {
    // Fila nativa (sin ninguna columna derivada)
    const insRes = await pool.query(
      `INSERT INTO inventory.product_prices
        (product_id, price_type, currency_code, purchase_exchange_rate,
         sales_exchange_rate, base_cost, other_costs, purchase_tax_percent,
         profit_percent, expense_percent, sales_tax_percent, sale_price,
         is_active, start_date)
       VALUES ($1,'SELLING','VES',1,1,100,10,16,10,5,16,NULL,true,CURRENT_DATE)
       RETURNING *`,
      [productId],
    );
    const row = insRes.rows[0];
    priceId = row.id;

    // No se persiste ningún importe derivado (columnas no existen).
    expect(row.total_cost).toBeUndefined();
    expect(row.final_price_gross).toBeUndefined();

    const breakdown = computePriceBreakdown({
      currencyCode: row.currency_code,
      priceType: row.price_type,
      purchaseExchangeRate: Number(row.purchase_exchange_rate),
      salesExchangeRate: Number(row.sales_exchange_rate),
      baseCost: Number(row.base_cost),
      otherCosts: Number(row.other_costs),
      purchaseTaxPercent: Number(row.purchase_tax_percent),
      profitPercent: Number(row.profit_percent),
      expensePercent: Number(row.expense_percent),
      salesTaxPercent: Number(row.sales_tax_percent),
      salePrice:
        row.sale_price != null ? Number(row.sale_price) : undefined,
    });

    expect(breakdown.totalCost).toBeCloseTo(127.6, 6);
    expect(breakdown.finalPriceNet).toBeCloseTo(147.378, 6);
    expect(breakdown.finalPriceGross).toBeCloseTo(170.95848, 6);
    expect(breakdown.totalCostVes).toBeCloseTo(127.6, 6);
    expect(breakdown.finalPriceGrossVes).toBeCloseTo(170.95848, 6);
  });
});
