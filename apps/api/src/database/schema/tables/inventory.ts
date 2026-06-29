import { timestamps } from '@/database/timestamps';
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  currencyCodeEnum,
  fixedAssetsInventoryStatus,
  inventoryMovementStatusEnum,
  movementTypeInventoryEnum,
  priceTypeEnum,
  productStatus,
  statusSuppliers,
  unitOfMeasureEnum,
} from '../enum';
import { purchaseOrderItems, purchaseOrders, supplierInvoices, suppliers } from './purchasing';
import { tenants } from './tenants';
import { inventorySchema } from "../_schemas";
import { associates } from './savings';
import { accountingEntries } from './accounting';


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
    internalCode: varchar('internal_code', { length: 50 }).notNull().unique(),
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
  priceType: priceTypeEnum('price_type').notNull(),

  // 1. Contexto de Moneda y Tasa de Cambio en el momento del cálculo
  currencyCode: currencyCodeEnum('currency_code').notNull().default('VES'),
  purchaseExchangeRate: numeric('purchase_exchange_rate', { precision: 18, scale: 6 }).notNull().default('1.000000'),
  salesExchangeRate: numeric('sales_exchange_rate', { precision: 18, scale: 6 }).notNull().default('1.000000'),

  // 2. Bloque de Costos (Moneda Origen de la transacción)
  baseCost: numeric('base_cost', { precision: 18, scale: 6 }).notNull().default('0'), // costo neto factura
  otherCosts: numeric('other_costs', { precision: 18, scale: 6 }).notNull().default('0'), // flete, seguro, etc.
  purchaseTaxPercent: numeric('purchase_tax_percent', { precision: 5, scale: 2 }).notNull().default('16.00'), // % IVA compra
  totalCost: numeric('total_cost', { precision: 18, scale: 6 }).notNull().default('0'), // Costo total en moneda origen

  // 3. Bloque de Costos en Bolívares (Calculados/Espejo)
  baseCostVes: numeric('base_cost_ves', { precision: 18, scale: 6 }).notNull().default('0'),
  otherCostsVes: numeric('other_costs_ves', { precision: 18, scale: 6 }).notNull().default('0'),
  totalCostVes: numeric('total_cost_ves', { precision: 18, scale: 6 }).notNull().default('0'),

  // 4. Bloque de Venta y Utilidad (Moneda Origen)
  profitPercent: numeric('profit_percent', { precision: 5, scale: 2 }).notNull().default('0'), // % utilidad
  expensePercent: numeric('expense_percent', { precision: 5, scale: 2 }).notNull().default('0'), // % gastos
  salesTaxPercent: numeric('sales_tax_percent', { precision: 5, scale: 2 }).notNull().default('16.00'), // % IVA venta

  salePrice: numeric('sale_price', { precision: 18, scale: 6 }), // Precio directo en divisa (sin margen)
  offerSalePrice: numeric('offer_sale_price', { precision: 18, scale: 6 }), // Precio oferta directo en divisa
  bsPriceAmount: numeric('bs_price_amount', { precision: 18, scale: 6 }), // Monto en divisa para pago en Bs

  finalPriceNet: numeric('final_price_net', { precision: 18, scale: 6 }).notNull().default('0'), // Precio de venta sin IVA
  finalPriceGross: numeric('final_price_gross', { precision: 18, scale: 6 }).notNull().default('0'), // Precio de venta con IVA

  // 5. Bloque de Venta en Bolívares (Espejo calculado)
  finalPriceNetVes: numeric('final_price_net_ves', { precision: 18, scale: 6 }).notNull().default('0'),
  finalPriceGrossVes: numeric('final_price_gross_ves', { precision: 18, scale: 6 }).notNull().default('0'),

  // Backward compatibility alias
  finalPrice: numeric('final_price', { precision: 18, scale: 6 }),

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
  internalCode: varchar('internal_code', { length: 50 }).notNull().unique(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => inventoriesCategories.id, { onDelete: 'restrict' }),
  description: text('description'),
  status: statusSuppliers('status').notNull().default('ACTIVE'),
  serviceType: varchar('service_type', { length: 50 }).notNull(),
  ...timestamps,
});

/* ----------   Servicio (histórico / vigente) ---------- */
export const servicePrices = inventorySchema.table('service_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id')
    .notNull()
    .references(() => services.id, { onDelete: 'cascade' }),
  suppliersId: uuid('supplier_id').references(() => suppliers.id), // opcional

  currencyCode: currencyCodeEnum('currency_code').notNull().default('VES'),
  purchaseExchangeRate: numeric('purchase_exchange_rate', { precision: 18, scale: 6 }).notNull().default('1.000000'),

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
export const inventoryMovements = inventorySchema.table(
  'inventory_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    movementNumber: varchar('movement_number', { length: 50 }).notNull(),
    movementType: movementTypeInventoryEnum('movement_type').notNull(),
    movementDate: timestamp('movement_date').defaultNow().notNull(),

    status: inventoryMovementStatusEnum('status').notNull().default('draft'),
    description: text('description'),

    // Referencias opcionales de documentos de origen / destino
    purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id, { onDelete: 'set null' }),
    supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
    invoiceNumber: varchar('invoice_number', { length: 50 }),
    associateId: uuid('associate_id').references(() => associates.id, { onDelete: 'set null' }),

    // Autorreferencia para trazabilidad (ej. una devolución que apunta al movimiento original)
    originMovementId: uuid('origin_movement_id').references((): any => inventoryMovements.id, { onDelete: 'set null' }),

    // Enlaces de integración financiera
    creditId: uuid('credit_id'), // Añade la referencia .references(() => credits.id) si aplica
    accountingEntryId: uuid('accounting_entry_id').references(() => accountingEntries.id, { onDelete: 'set null' }),

    // Auditoría avanzada de estados
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
    cancelledBy: uuid('cancelled_by'),
    cancelledAt: timestamp('cancelled_at'),

    ...timestamps,
  },
  (table) => [
    // Índices compuestos optimizados para multi-tenant reflejando tu diseño de Convex
    uniqueIndex('inv_mov_tenant_number_idx').on(table.tenantId, table.movementNumber),
    index('inv_mov_tenant_type_idx').on(table.tenantId, table.movementType),
    index('inv_mov_tenant_date_idx').on(table.tenantId, table.movementDate),
  ]
);

/* ---------- 7.2. DETALLE: ÍTEMS DEL MOVIMIENTO (DETALLE) ---------- */
export const inventoryMovementItems = inventorySchema.table(
  'inventory_movement_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    movementId: uuid('movement_id')
      .notNull()
      .references(() => inventoryMovements.id, { onDelete: 'cascade' }),

    // ID del producto o ítem de inventario
    productId: uuid('product_id').notNull(), // Añade .references(() => products.id) si tienes la tabla products suelta

    quantity: integer('quantity').notNull(),

    // Mantenemos alta precisión numérica para costos en el ERP (precision: 18, scale: 6)
    unitCost: numeric('unit_cost', { precision: 18, scale: 6 }).notNull().default('0.000000'),
    totalCost: numeric('total_cost', { precision: 18, scale: 6 }).notNull().default('0.000000'),

    // Enlace opcional a la línea de la orden de compra original
    purchaseOrderItemId: uuid('purchase_order_item_id').references(() => purchaseOrderItems.id, { onDelete: 'set null' }),

    ...timestamps,
  },
  (table) => [
    index('inv_mov_items_movement_idx').on(table.movementId),
    index('inv_mov_items_product_idx').on(table.productId),
  ]
);