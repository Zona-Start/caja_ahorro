import {
  date,
  index,
  integer,
  numeric,
  serial,
  text,
  varchar,
} from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';
import { fixedAssetsInventoryStatus, saleProductStatus } from './enum';
import { inventorySchema } from './schemas';

// Tabla para las categorías de los productos que se venden
export const salesProductCategories = inventorySchema.table(
  'sales_product_categories',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(), // Ej: "Electrodomésticos", "Informática"
    description: text('description'),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index('sales_prod_cat_name_idx').on(table.name),
  }),
);

// Tabla para la definición de los productos genéricos que vendes
export const salesProducts = inventorySchema.table(
  'sales_products',
  {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => salesProductCategories.id, { onDelete: 'restrict' }),

    productCode: varchar('product_code', { length: 50 }).notNull().unique(), // Código SKU interno del producto (Ej: REF001)
    name: varchar('name', { length: 255 }).notNull(), // Nombre del producto (Ej: "Refrigerador 250L")
    description: text('description'),
    brand: varchar('brand', { length: 100 }),
    model: varchar('model', { length: 100 }),

    defaultPurchaseCost: numeric('default_purchase_cost', {
      precision: 20,
      scale: 6,
    }).notNull(), // Costo estándar para la caja
    defaultSellingPrice: numeric('default_selling_price', {
      precision: 20,
      scale: 6,
    }).notNull(), // Precio estándar al asociado

    currentStock: integer('current_stock').notNull().default(0), // Cantidad de unidades disponibles para venta
    minimumStockAlert: integer('minimum_stock_alert').default(0), // Umbral de alerta por bajo stock

    status: saleProductStatus('status').notNull().default('AVAILABLE'), // 'ACTIVO', 'DESCONTINUADO'

    ...timestamps,
  },
  (table) => ({
    productCodeIdx: index('sales_prod_code_idx').on(table.productCode),
    categoryIdIdx: index('sales_prod_cat_id_idx').on(table.categoryId),
  }),
);

// Tabla para las categorías de activos fijos (ej: "Mobiliario", "Equipos de Oficina")
export const fixedAssetCategories = inventorySchema.table(
  'fixed_asset_categories',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(), // Ej: "Mobiliario", "Equipos de Cómputo", "Vehículos"
    description: text('description'),
    defaultUsefulLifeYears: integer('default_useful_life_years'), // Años de vida útil contable por defecto
    defaultDepreciationMethod: varchar('default_depreciation_method', {
      length: 50,
    }), // Ej: "Linea Recta"
    ...timestamps,
  },
  (table) => ({
    nameIdx: index('fixed_asset_cat_name_idx').on(table.name),
  }),
);

// Tabla principal para cada activo fijo individual
export const fixedAssets = inventorySchema.table(
  'fixed_assets',
  {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => fixedAssetCategories.id, { onDelete: 'restrict' }),

    assetCode: varchar('asset_code', { length: 50 }).notNull().unique(), // Código interno de inventario del activo (Ej: OFI001, COMP002)
    name: varchar('name', { length: 255 }).notNull(), // Nombre del activo (Ej: "Escritorio Gerencial", "Impresora Multifuncional HP")
    description: text('description'),
    serialNumber: varchar('serial_number', { length: 100 }), // Número de serie del fabricante (si aplica)
    model: varchar('model', { length: 100 }),
    brand: varchar('brand', { length: 100 }),

    acquisitionDate: date('acquisition_date').notNull(),
    purchasePrice: numeric('purchase_price', {
      precision: 20,
      scale: 6,
    }).notNull(), // Costo de adquisición original

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
    disposalValue: numeric('disposal_value', { precision: 20, scale: 6 }), // Valor por el que se dio de baja

    ...timestamps,
  },
  (table) => ({
    assetCodeIdx: index('fixed_asset_code_idx').on(table.assetCode),
    categoryIdIdx: index('fixed_asset_cat_id_idx').on(table.categoryId),
    statusIdx: index('fixed_asset_status_idx').on(table.assetStatus),
  }),
);

// Opcional: Tabla para registrar mantenimientos específicos de los activos fijos
export const fixedAssetMaintenances = inventorySchema.table(
  'fixed_asset_maintenances',
  {
    id: serial('id').primaryKey(),
    assetId: integer('asset_id')
      .notNull()
      .references(() => fixedAssets.id, { onDelete: 'cascade' }),
    maintenanceDate: date('maintenance_date').notNull(),
    maintenanceType: varchar('maintenance_type', { length: 100 }), // Ej: "Preventivo", "Correctivo"
    description: text('description').notNull(),
    cost: numeric('cost', { precision: 20, scale: 6 }).default('0.00'),
    performedBy: varchar('performed_by', { length: 255 }), // Quién lo realizó
    // Opcional: bankTransactionId si el pago se registró en el banco
    ...timestamps,
  },
  (table) => ({
    assetIdIdx: index('fixed_asset_maint_asset_id_idx').on(table.assetId),
  }),
);
