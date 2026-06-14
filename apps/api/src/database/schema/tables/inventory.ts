import { timestamps } from '@/database/timestamps';
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgSchema,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  fixedAssetsInventoryStatus,
  movementTypeInventory,
  priceTypeEnum,
  productStatus,
  statusSuppliers,
  unitOfMeasureEnum,
} from '../enum';
import { supplierInvoices, suppliers } from './purchasing';
import { tenants } from './tenants';
import { inventorySchema } from "../_schemas";


// Tabla para las categorías de los productos que se venden
export const inventoriesCategories = inventorySchema.table(
  'inventories_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    group: varchar('group', { length: 100 }).notNull(),
    name: varchar('name', { length: 100 }).notNull().unique(), // Ej: "Electrodomésticos", "Informática"
    description: text('description'),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index('inventory_categories_name_idx').on(table.name),
    groupIdx: index('inventory_categories_group_idx').on(table.group),
  }),
);

// Tabla para la definición de los productos genéricos que vendes
export const products = inventorySchema.table(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => inventoriesCategories.id, { onDelete: 'restrict' }),

    sku: varchar('sku', { length: 50 }).notNull().unique(), // Código SKU interno del producto (Ej: REF001)
    name: varchar('name', { length: 255 }).notNull(), // Nombre del producto (Ej: "Refrigerador 250L")
    description: text('description'),
    brand: varchar('brand', { length: 100 }),
    model: varchar('model', { length: 100 }),

    /* STOCK CONTROL */
    stockMin: integer('stock_min').notNull().default(0),
    stockMax: integer('stock_max').notNull().default(0),
    reorderPoint: integer('reorder_point').notNull().default(0), // punto de pedido

    /* STOCK DINÁMICO (calculado o snapshot) */
    stockOnHand: integer('stock_on_hand').notNull().default(0), // físico
    stockCommitted: integer('stock_committed').notNull().default(0), // vendido aún no entregado
    stockOnOrder: integer('stock_on_order').notNull().default(0), // en proceso de compra

    /* stockDisponible = stockOnHand - stockCommitted + stockOnOrder */

    status: productStatus('status').notNull().default('DISABLED'), // 'ACTIVO', 'DESCONTINUADO'
    unitOfMeasure: unitOfMeasureEnum('unit_of_measure'),
    ...timestamps,
  },
  (table) => ({
    skuIdx: index('sales_prod_sku_idx').on(table.sku),
    nameIdx: index('sales_prod_name_idx').on(table.sku),
    categoryIdIdx: index('sales_prod_cat_id_idx').on(table.categoryId),
  }),
);

/* ----------   PRECIOS (histórico / vigente) ---------- */
export const productPrices = inventorySchema.table('product_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  suppliersId: uuid('supplier_id').references(() => suppliers.id), // opcional
  priceType: priceTypeEnum('price_type').notNull(),

  /* =========  COSTO  ========= */
  baseCost: numeric('base_cost', { precision: 18, scale: 6 }), // costo neto factura
  otherCosts: numeric('other_costs', { precision: 18, scale: 6 }) // flete, seguro, etc.
    .default('0.00'),
  purchaseTax: numeric('purchase_tax', { precision: 18, scale: 6 }) // impuesto interno
    .default('0.00'),
  /* Costo total = baseCost + otherCosts + purchaseTax */
  totalCost: numeric('total_cost', { precision: 18, scale: 6 }), // calculado o guardado

  /* =========  VENTA / OFERTA  ========= */
  /* Campos usados cuando priceType = 'SELLING' o 'OFFER' */
  expensePercent: numeric('expense_percent', { precision: 5, scale: 2 }) // % gastos
    .default('0.00'),
  profitPercent: numeric('profit_percent', { precision: 5, scale: 2 }) // % utilidad
    .default('0.00'),
  salesTaxPercent: numeric('sales_tax_percent', { precision: 5, scale: 2 }) // % IVA o similar
    .default('0.00'),
  /* Precio final calculado */
  finalPrice: numeric('final_price', { precision: 18, scale: 6 }), // precio de lista
  supplierInvoiceId: uuid('supplier_invoice_id').references(
    () => supplierInvoices.id,
  ),

  startDate: date('start_date').defaultNow(),
  endDate: date('end_date'),
  isActive: boolean('is_active').default(true),
  ...timestamps,
});

export const services = inventorySchema.table('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  serviceCode: varchar('service_code', { length: 50 }).notNull().unique(), // Código interno de inventario del activo (Ej: OFI001, COMP002)
  categoryId: uuid('category_id')
    .notNull()
    .references(() => inventoriesCategories.id, { onDelete: 'restrict' }),
  description: text('description'),
  status: statusSuppliers('status').notNull().default('ACTIVE'),
  ...timestamps,
});

/* ----------   Servicio (histórico / vigente) ---------- */
export const servicePrices = inventorySchema.table('service_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id')
    .notNull()
    .references(() => services.id, { onDelete: 'cascade' }),
  suppliersId: uuid('supplier_id').references(() => suppliers.id), // opcional

  /* =========  COSTO  ========= */
  baseCost: numeric('base_cost', { precision: 18, scale: 6 }), // costo neto factura
  otherCosts: numeric('other_costs', { precision: 18, scale: 6 }) // flete, seguro, etc.
    .default('0.00'),
  purchaseTax: numeric('purchase_tax', { precision: 18, scale: 6 }) // impuesto interno
    .default('0.00'),
  /* Costo total = baseCost + otherCosts + purchaseTax */
  totalCost: numeric('total_cost', { precision: 18, scale: 6 }), // calculado o guardado

  supplierInvoiceId: uuid('supplier_invoice_id').references(
    () => supplierInvoices.id,
  ),

  startDate: date('start_date').defaultNow(),
  endDate: date('end_date'),
  isActive: boolean('is_active').default(true),
  ...timestamps,
});

export const productServiceSuppliers = inventorySchema.table(
  'product_service_suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    productId: uuid('product_id').references(() => products.id, {
      onDelete: 'cascade',
    }),
    serviceId: uuid('service_id').references(() => services.id, {
      onDelete: 'cascade',
    }),
    fixedAssetsId: uuid('fixed_Assets_id').references(() => fixedAssets.id, {
      onDelete: 'cascade',
    }),
    suppliersId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    leadTimeDays: integer('lead_time_days').default(0), // días de entrega
    preferred: boolean('preferred').default(false), // ¿proveedor principal?
  },
  (table) => ({
    productIdx: index('product_idx').on(table.productId),
    serviceIdx: index('service_idx').on(table.serviceId),
    supplierIdx: index('supplier_idx').on(table.suppliersId),
  }),
);

// Tabla principal para cada activo fijo individual
export const fixedAssets = inventorySchema.table(
  'fixed_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => inventoriesCategories.id, { onDelete: 'restrict' }),

    assetCode: varchar('asset_code', { length: 50 }).notNull().unique(), // Código interno de inventario del activo (Ej: OFI001, COMP002)
    name: varchar('name', { length: 255 }).notNull(), // Nombre del activo (Ej: "Escritorio Gerencial", "Impresora Multifuncional HP")
    description: text('description'),
    serialNumber: varchar('serial_number', { length: 100 }), // Número de serie del fabricante (si aplica)
    model: varchar('model', { length: 100 }),
    brand: varchar('brand', { length: 100 }),
    acquisitionDate: date('acquisition_date').notNull(),

    // Aquí se omite `currentLocation` y `assignedToUserId` ya que la caja es el único responsable y ubicación

    assetStatus: fixedAssetsInventoryStatus('asset_status')
      .notNull()
      .default('ACTIVE'),

    // Información Contable de Depreciación
    usefulLifeYears: integer('useful_life_years'), // Vida útil específica de este activo (si difiere de la categoría)
    depreciationMethod: varchar('depreciation_method', { length: 50 }),
    accumulatedDepreciation: numeric('accumulated_depreciation', {
      precision: 20,
      scale: 6,
    }).default('0.00'),
    lastDepreciationDate: date('last_depreciation_date'), // Fecha de última depreciación calculada

    // Información de Baja
    disposalDate: date('disposal_date'),
    disposalReason: text('disposal_reason'), // Ej: "Venta", "Desecho por Obsolescencia", "Robo"
    disposalValue: numeric('disposal_value', { precision: 18, scale: 2 }), // Valor por el que se dio de baja

    ...timestamps,
  },
  (table) => ({
    assetCodeIdx: index('fixed_asset_code_idx').on(table.assetCode),
    categoryIdIdx: index('fixed_asset_cat_id_idx').on(table.categoryId),
    statusIdx: index('fixed_asset_status_idx').on(table.assetStatus),
  }),
);

/* ----------   Activo fijo (histórico / vigente) ---------- */
export const fixedAssetsPrices = inventorySchema.table('fixed_assets_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  fixedAssetsId: uuid('fixed_assets_id')
    .notNull()
    .references(() => fixedAssets.id, { onDelete: 'cascade' }),
  suppliersId: uuid('supplier_id').references(() => suppliers.id), // opcional

  /* =========  COSTO  ========= */
  baseCost: numeric('base_cost', { precision: 18, scale: 6 }), // costo neto factura
  otherCosts: numeric('other_costs', { precision: 18, scale: 6 }) // flete, seguro, etc.
    .default('0.00'),
  purchaseTax: numeric('purchase_tax', { precision: 18, scale: 6 }) // impuesto interno
    .default('0.00'),
  /* Costo total = baseCost + otherCosts + purchaseTax */
  totalCost: numeric('total_cost', { precision: 18, scale: 6 }), // calculado o guardado

  supplierInvoiceId: uuid('supplier_invoice_id').references(
    () => supplierInvoices.id,
  ),

  startDate: date('start_date').defaultNow(),
  endDate: date('end_date'),
  isActive: boolean('is_active').default(true),
  ...timestamps,
});

/* ---------- 7.  MOVIMIENTOS DE INVENTARIO ---------- */
export const inventoryMovements = inventorySchema.table('inventory_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  description: text('description'),
  movementDate: date('movement_date').defaultNow(),
  itemId: uuid('item_id').notNull(),
  itemType: varchar('item_type', {
    enum: ['PRODUCT', 'FIXED_ASSET'],
  }).notNull(),
  movementNumber: varchar('movement_number', { length: 50 }).notNull(),
  movementType: movementTypeInventory('movement_type').notNull(),
  quantity: integer('quantity').notNull(),
  unitCost: numeric('unit_cost', { precision: 18, scale: 2 }),
  documentType: varchar('document_type', { length: 50 }), // COMPRA, VENTA, NC, ND, AJUSTE…
  documentNumber: varchar('document_number', { length: 50 }),
  supplierInvoiceId: uuid('supplier_invoice_id').references(
    () => supplierInvoices.id,
  ),
  notes: text('notes'),
  ...timestamps,
});
