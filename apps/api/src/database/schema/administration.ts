import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  serial,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';
import { company, states } from './core';
import {
  categorySuppliers,
  currencyCodeEnum,
  fixedAssetsInventoryStatus,
  invoiceSuppliersStatusEnum,
  movementTypeInventory,
  paymentAccountsPayableEnum,
  paymentMethodEnum,
  paymentSupplierStatusEnum,
  priceTypeEnum,
  productStatus,
  purchaseOrderStatusEnum,
  purchaseOrderTypeEnum,
  statusSuppliers,
  supplierInvoicesPaymentEnum,
  supplierTransactionsTypeEnum,
  unitOfMeasureEnum,
} from './enum';

import { relations } from 'drizzle-orm';
import { accountPlan } from './accounting';
import { bankAccounts, bankTransactions } from './banking';
import { administrationSchema, inventorySchema } from './schemas';

// tabla proveedores
export const suppliers = administrationSchema.table(
  'suppliers',
  {
    id: serial('id').primaryKey(),
    companyId: integer('company_id').references(() => company.id, {
      onDelete: 'cascade',
    }),
    code: varchar('code', { length: 50 }).unique().notNull(),
    name: varchar('name', { length: 255 }).notNull(), // Nombre del proveedor
    taxId: varchar('tax_id', { length: 50 }).unique().notNull(), // RIF, RUC, NIT, o equivalente fiscal
    contactName: varchar('contact_name', { length: 255 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 50 }),
    state: integer('state').references(() => states.id, {
      onDelete: 'set null',
    }),
    address: text('address'),
    category: categorySuppliers('category').notNull(),
    status: statusSuppliers('status').notNull().default('ACTIVE'), // Para proveedores que ya no usamos

    ...timestamps,
  },
  (table) => ({
    supplierNameIdx: index('supplier_name_idx').on(table.name),
    supplierTaxIdx: index('supplier_tax_idx').on(table.taxId),
  }),
);

//Tabla purchase_orders (Pedidos/Facturas de Compra)
export const purchaseOrders = administrationSchema.table(
  'purchase_orders',
  {
    id: serial('id').primaryKey(),
    supplierId: integer('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
    status: purchaseOrderStatusEnum('status').notNull().default('PENDING'), // Utiliza el enum de cuentas por pagar: PENDING, PAID, CANCELLED, etc.
    orderDate: date('order_date').notNull(),
    expectedDeliveryDate: date('expected_delivery_date'),

    /* totales de la orden */
    subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull(),
    taxAmount: numeric('tax_amount', { precision: 18, scale: 2 }).default(
      '0.00',
    ),
    totalAmount: numeric('total_amount', { precision: 18, scale: 2 }).notNull(),
    currencyCode: currencyCodeEnum('currency_code').notNull(),
    observations: text('observations'),

    // Campos para auditoría y tiempo
    ...timestamps,
  },
  (table) => ({
    // Índice para asegurar que el número de factura sea único por proveedor
    orderNumberIdx: uniqueIndex('po_order_number_idx').on(table.orderNumber),
  }),
);

//Tabla purchase_items (Ítems Comprados)
export const purchaseOrderItems = administrationSchema.table(
  'purchase_order_items',
  {
    id: serial('id').primaryKey(),
    purchaseOrderId: integer('purchase_order_id')
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: 'cascade' }),
    lineType: purchaseOrderTypeEnum('line_type').notNull(),
    itemId: integer('itemId'),
    // Datos genéricos del ítem comprado
    description: varchar('description', { length: 255 }),
    quantity: integer('quantity').notNull(),
    unitCost: numeric('unit_cost', { precision: 18, scale: 6 }).notNull(),
    totalCost: numeric('total_cost', { precision: 18, scale: 2 }).notNull(),
    ...timestamps,
  },
);

// TABLA RECEPCIÓN DE FACTURAS
export const supplierInvoices = administrationSchema.table(
  'supplier_invoices',
  {
    id: serial('id').primaryKey(),
    supplierId: integer('supplier_id')
      .notNull()
      .references(() => suppliers.id),

    /* puede venir de una orden de compra o ser “libre” */
    purchaseOrderId: integer('purchase_order_id').references(
      () => purchaseOrders.id,
      { onDelete: 'set null' },
    ),
    supplierInvoiceNumber: varchar('supplier_invoice_number', { length: 50 })
      .notNull()
      .unique(),
    invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
    controlNumber: varchar('control_number', { length: 100 }), // Nº control fiscal
    invoiceDate: date('invoice_date').notNull(),
    dueDate: date('due_date'),
    subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull(),
    taxAmount: numeric('tax_amount', { precision: 18, scale: 2 }).default(
      '0.00',
    ),
    totalAmount: numeric('total_amount', { precision: 18, scale: 2 }).notNull(),
    currencyCode: currencyCodeEnum('currency_code').notNull(),

    paymentType: supplierInvoicesPaymentEnum('payment_type')
      .notNull()
      .default('CREDIT'),

    status: invoiceSuppliersStatusEnum('status').notNull().default('DRAFT'),
    observations: text('observations'),

    //datos bancarios
    //datos para guardar datos bancarios
    chargePayment: boolean('charge_payment').default(false),
    paymentBankReference: varchar('payment_bank_reference', { length: 50 }),
    paymentDescription: varchar('payment_description', { length: 255 }),
    paymentAmount: numeric('payment_amount', {
      precision: 18,
      scale: 2,
    }),
    transactionDate: date('transaction_date'),
    paymentMethod: paymentMethodEnum('payment_method'),
    bankAccountId: integer('bank_account_id').references(() => bankAccounts.id),

    //manejo de datos anticipo
    draftAppliedAdvances: jsonb('draft_applied_advances').default('[]'),
    /* FK opcional al asiento contable al recibir la factura */
    // accountingEntryId: integer('accounting_entry_id').references(() => entradaContables.id),

    ...timestamps,
  },
  (table) => ({
    invoiceUnique: uniqueIndex('si_invoice_unique_idx').on(
      table.supplierId,
      table.invoiceNumber,
    ),
  }),
);

/* Líneas de la factura recibida */
export const supplierInvoiceItems = administrationSchema.table(
  'supplier_invoice_items',
  {
    id: serial('id').primaryKey(),
    invoiceId: integer('invoice_id')
      .notNull()
      .references(() => supplierInvoices.id, { onDelete: 'cascade' }),

    lineType: purchaseOrderTypeEnum('line_type').notNull(),
    itemId: integer('item_id'), // Puede ser producto, servicio o activo fijo
    expenseAccountId: integer('expense_account_id').references(
      () => accountPlan.id,
    ),

    description: varchar('description', { length: 255 }),
    quantity: integer('quantity').notNull(),
    unitCost: numeric('unit_cost', { precision: 18, scale: 6 }).notNull(),
    totalLine: numeric('total_line', { precision: 18, scale: 2 }).notNull(),

    ...timestamps,
  },
);

//Tabla accounts_payable (Cuentas por Pagar / Facturas)
export const accountsPayable = administrationSchema.table(
  'accounts_payable',
  {
    id: serial('id').primaryKey(),
    supplierId: integer('supplier_id').references(() => suppliers.id, {
      onDelete: 'cascade',
    }),
    supplierInvoiceId: integer('supplier_invoice_id')
      .unique()
      .references(() => supplierInvoices.id, { onDelete: 'cascade' }),
    accountsPayableNumber: varchar('ap_number', { length: 50 })
      .notNull()
      .unique(),
    /* saldos calculados o actualizados por triggers */
    originalAmount: numeric('original_amount', {
      precision: 18,
      scale: 2,
    }).notNull(),
    paidAmount: numeric('paid_amount', { precision: 18, scale: 2 })
      .notNull()
      .default('0.00'),
    remainingAmount: numeric('remaining_amount', {
      precision: 18,
      scale: 2,
    }).notNull(),
    dueDate: date('due_date'),
    currencyCode: currencyCodeEnum('currency_code').notNull(),
    status: paymentAccountsPayableEnum('status').notNull().default('PENDING'),
    observations: text('observations'),
    // Referencia al asiento contable (entrada_contables) si se registra al recibir la factura.
    // Esto es un débito a una cuenta de gastos y un crédito a Cuentas por Pagar (Pasivo).
    // accountingEntryId: integer('accounting_entry_id').references(() => entradaContables.id),
    ...timestamps,
  },
  (table) => ({
    payableInvoiceUnique: uniqueIndex('payable_invoice_uidx').on(
      table.supplierInvoiceId,
    ), // Factura única por proveedor y compañía
    payableStatusIdx: index('ap_status_idx').on(table.status),
  }),
);

export const supplierPayments = administrationSchema.table(
  'supplier_payments',
  {
    id: serial('id').primaryKey(),
    paymentNumber: varchar('payment_number', { length: 50 }).notNull().unique(), // PAG-P-2025-000123
    supplierId: integer('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),

    totalAmount: numeric('total_amount', { precision: 18, scale: 2 }).notNull(),
    currencyCode: currencyCodeEnum('currency_code').notNull(),

    // datos del medio de pago
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    bankAccountId: integer('bank_account_id').references(
      () => bankAccounts.id /* tu tabla bancos */,
    ),
    bankReference: varchar('bank_reference', { length: 50 }),
    bankDescription: varchar('bank_description', { length: 255 }),
    bankTransactionDate: date('bank_transaction_date'),
    //batchFileId: integer('batch_file_id').references(() => /* tabla lote txt */),

    status: paymentSupplierStatusEnum('status').notNull().default('DRAFT'),

    requestedAt: date('requested_at').notNull().defaultNow(), // fecha solicitud
    processedAt: date('processed_at'), // fecha respuesta banco
    reversedAt: date('reversed_at'), // si se anula
    observations: text('observations'),

    ...timestamps,
  },
);

export const supplierPaymentLines = administrationSchema.table(
  'supplier_payment_lines',
  {
    id: serial('id').primaryKey(),
    supplierPaymentId: integer('supplier_payment_id')
      .notNull()
      .references(() => supplierPayments.id, { onDelete: 'cascade' }),

    // puede apuntar a una CxP o ser un anticipo:
    accountsPayableId: integer('accounts_payable_id').references(
      () => accountsPayable.id,
      { onDelete: 'cascade' },
    ),

    amount: numeric('amount', { precision: 18, scale: 2 }).notNull(), // siempre positivo
    description: varchar('description', { length: 255 }),

    ...timestamps,
  },
);

// Tabla genérica que cubre pagos, NC, ND y anticipos contra cuentas por pagar
export const supplierTransactions = administrationSchema.table(
  'supplier_transactions',
  {
    id: serial('id').primaryKey(),

    // 1) Obligatorio para NC/ND/Pagos, NULL para anticipos “sueltos”
    accountsPayableId: integer('accounts_payable_id').references(
      () => accountsPayable.id,
      { onDelete: 'cascade' },
    ),
    relatedAdvanceId: integer('related_advance_id').references(
      () => accountsPayable.id,
      { onDelete: 'set null' },
    ),

    // 2) Número único → generado con tu servicio PAG-P-2025-…
    transactionNumber: varchar('transaction_number', { length: 50 })
      .notNull()
      .unique(),

    // 3) Tipo
    transactionType: supplierTransactionsTypeEnum('transaction_type').notNull(), // PAYMENT | CREDIT_NOTE | DEBIT_NOTE | ADVANCE

    // 4) Fecha y valor absoluto
    transactionDate: date('transaction_date').notNull(),
    amount: numeric('amount', { precision: 18, scale: 2 }).notNull(), // siempre positivo
    direction: varchar('direction', { enum: ['DR', 'CR'] }).notNull(), // DR = carga al proveedor, CR = pago/abono

    currencyCode: currencyCodeEnum('currency_code').notNull(),

    // 5) Sólo si es pago o anticipo
    paymentMethod: paymentMethodEnum('payment_method'),
    bankMovementId: integer('bank_movement_id').references(
      () => bankTransactions.id,
    ), // para conciliar

    reference: varchar('reference', { length: 255 }), // cheque, transferencia, nro-NC, etc.
    status: varchar('status', { enum: ['ACTIVE', 'REVERSED'] })
      .notNull()
      .default('ACTIVE'),

    ...timestamps,
  },
);

// Tabla para las categorías de los productos que se venden
export const inventoriesCategories = inventorySchema.table(
  'inventories_categories',
  {
    id: serial('id').primaryKey(),
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
    id: serial('id').primaryKey(),
    categoryId: integer('category_id')
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
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  suppliersId: integer('supplier_id').references(() => suppliers.id), // opcional
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

  startDate: date('start_date').defaultNow(),
  endDate: date('end_date'),
  isActive: boolean('is_active').default(true),
  ...timestamps,
});

export const services = inventorySchema.table('services', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  serviceCode: varchar('service_code', { length: 50 }).notNull().unique(), // Código interno de inventario del activo (Ej: OFI001, COMP002)
  categoryId: integer('category_id')
    .notNull()
    .references(() => inventoriesCategories.id, { onDelete: 'restrict' }),
  description: text('description'),
  status: statusSuppliers('status').notNull().default('ACTIVE'),
  ...timestamps,
});

/* ----------   Servicio (histórico / vigente) ---------- */
export const servicePrices = inventorySchema.table('service_prices', {
  id: serial('id').primaryKey(),
  serviceId: integer('service_id')
    .notNull()
    .references(() => services.id, { onDelete: 'cascade' }),
  suppliersId: integer('supplier_id').references(() => suppliers.id), // opcional

  /* =========  COSTO  ========= */
  baseCost: numeric('base_cost', { precision: 18, scale: 6 }), // costo neto factura
  otherCosts: numeric('other_costs', { precision: 18, scale: 6 }) // flete, seguro, etc.
    .default('0.00'),
  purchaseTax: numeric('purchase_tax', { precision: 18, scale: 6 }) // impuesto interno
    .default('0.00'),
  /* Costo total = baseCost + otherCosts + purchaseTax */
  totalCost: numeric('total_cost', { precision: 18, scale: 6 }), // calculado o guardado

  startDate: date('start_date').defaultNow(),
  endDate: date('end_date'),
  isActive: boolean('is_active').default(true),
  ...timestamps,
});

export const productServiceSuppliers = inventorySchema.table(
  'product_service_suppliers',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id').references(() => products.id, {
      onDelete: 'cascade',
    }),
    serviceId: integer('service_id').references(() => services.id, {
      onDelete: 'cascade',
    }),
    fixedAssetsId: integer('fixed_Assets_id').references(() => fixedAssets.id, {
      onDelete: 'cascade',
    }),
    suppliersId: integer('supplier_id')
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
    id: serial('id').primaryKey(),
    categoryId: integer('category_id')
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
  id: serial('id').primaryKey(),
  fixedAssetsId: integer('fixed_assets_id')
    .notNull()
    .references(() => fixedAssets.id, { onDelete: 'cascade' }),
  suppliersId: integer('supplier_id').references(() => suppliers.id), // opcional

  /* =========  COSTO  ========= */
  baseCost: numeric('base_cost', { precision: 18, scale: 6 }), // costo neto factura
  otherCosts: numeric('other_costs', { precision: 18, scale: 6 }) // flete, seguro, etc.
    .default('0.00'),
  purchaseTax: numeric('purchase_tax', { precision: 18, scale: 6 }) // impuesto interno
    .default('0.00'),
  /* Costo total = baseCost + otherCosts + purchaseTax */
  totalCost: numeric('total_cost', { precision: 18, scale: 6 }), // calculado o guardado

  startDate: date('start_date').defaultNow(),
  endDate: date('end_date'),
  isActive: boolean('is_active').default(true),
  ...timestamps,
});

/* ---------- 7.  MOVIMIENTOS DE INVENTARIO ---------- */
export const inventoryMovements = inventorySchema.table('inventory_movements', {
  id: serial('id').primaryKey(),
  description: text('description'),
  movementDate: date('movement_date').defaultNow(),
  itemId: integer('item_id').notNull(),
  itemType: varchar('item_type', {
    enum: ['PRODUCT', 'FIXED_ASSET'],
  }).notNull(),
  movementNumber: varchar('movement_number', { length: 50 }).notNull(),
  movementType: movementTypeInventory('movement_type').notNull(),
  quantity: integer('quantity').notNull(),
  unitCost: numeric('unit_cost', { precision: 18, scale: 2 }),
  documentType: varchar('document_type', { length: 50 }), // COMPRA, VENTA, NC, ND, AJUSTE…
  documentNumber: varchar('document_number', { length: 50 }),
  notes: text('notes'),
  ...timestamps,
});

/* ---------- 1.  RELACIONES DE CATEGORÍAS ---------- */
export const inventoriesCategoriesRelations = relations(
  inventoriesCategories,
  ({ many }) => ({
    products: many(products),
    fixedAssets: many(fixedAssets),
    services: many(services),
  }),
);

/* ---------- 2.  RELACIONES DE PRODUCTOS ---------- */
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(inventoriesCategories, {
    fields: [products.categoryId],
    references: [inventoriesCategories.id],
  }),
  prices: many(productPrices),
  suppliers: many(productServiceSuppliers),
  movements: many(inventoryMovements),
}));

/* ---------- 3.  RELACIONES DE PRECIOS (productos) ---------- */
export const productPricesRelations = relations(productPrices, ({ one }) => ({
  product: one(products, {
    fields: [productPrices.productId],
    references: [products.id],
  }),
  supplier: one(suppliers, {
    fields: [productPrices.suppliersId],
    references: [suppliers.id],
  }),
}));

/* ---------- 4.  RELACIONES DE SERVICIOS ---------- */
export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(inventoriesCategories, {
    fields: [services.categoryId],
    references: [inventoriesCategories.id],
  }),
  prices: many(servicePrices),
  suppliers: many(productServiceSuppliers),
}));

/* ---------- 5.  RELACIONES DE PRECIOS (servicios) ---------- */
export const servicePricesRelations = relations(servicePrices, ({ one }) => ({
  service: one(services, {
    fields: [servicePrices.serviceId],
    references: [services.id],
  }),
  supplier: one(suppliers, {
    fields: [servicePrices.suppliersId],
    references: [suppliers.id],
  }),
}));

/* ---------- 6.  RELACIONES DE ACTIVOS FIJOS ---------- */
export const fixedAssetsRelations = relations(fixedAssets, ({ one, many }) => ({
  category: one(inventoriesCategories, {
    fields: [fixedAssets.categoryId],
    references: [inventoriesCategories.id],
  }),
  prices: many(fixedAssetsPrices),
  suppliers: many(productServiceSuppliers),
  movements: many(inventoryMovements),
}));

/* ---------- 7.  RELACIONES DE PRECIOS (activos fijos) ---------- */
export const fixedAssetsPricesRelations = relations(
  fixedAssetsPrices,
  ({ one }) => ({
    fixedAsset: one(fixedAssets, {
      fields: [fixedAssetsPrices.fixedAssetsId],
      references: [fixedAssets.id],
    }),
    supplier: one(suppliers, {
      fields: [fixedAssetsPrices.suppliersId],
      references: [suppliers.id],
    }),
  }),
);

/* ---------- 8.  RELACIONES DEL PUENTE product_service_suppliers ---------- */
export const productServiceSuppliersRelations = relations(
  productServiceSuppliers,
  ({ one }) => ({
    product: one(products, {
      fields: [productServiceSuppliers.productId],
      references: [products.id],
    }),
    service: one(services, {
      fields: [productServiceSuppliers.serviceId],
      references: [services.id],
    }),
    fixedAsset: one(fixedAssets, {
      fields: [productServiceSuppliers.fixedAssetsId],
      references: [fixedAssets.id],
    }),
    supplier: one(suppliers, {
      fields: [productServiceSuppliers.suppliersId],
      references: [suppliers.id],
    }),
  }),
);

/* ---------- 9.  RELACIONES DE PROVEEDORES ---------- */
export const suppliersRelations = relations(suppliers, ({ many }) => ({
  productLinks: many(productServiceSuppliers),
  productPrices: many(productPrices),
  servicePrices: many(servicePrices),
  fixedAssetsPrices: many(fixedAssetsPrices),
}));

/* ---------- 10.  RELACIONES DE MOVIMIENTOS DE INVENTARIO (polimórficas) ---------- */
export const inventoryMovementsRelations = relations(
  inventoryMovements,
  ({ one }) => ({
    /* Relación condicional según itemType */
    product: one(products, {
      fields: [inventoryMovements.itemId],
      references: [products.id],
      relationName: 'productMovements',
    }),
    fixedAsset: one(fixedAssets, {
      fields: [inventoryMovements.itemId],
      references: [fixedAssets.id],
      relationName: 'fixedAssetMovements',
    }),
  }),
);

export const supplierPaymentsRelations = relations(
  supplierPayments,
  ({ one, many }) => ({
    supplier: one(suppliers, {
      fields: [supplierPayments.supplierId],
      references: [suppliers.id],
    }),
    lines: many(supplierPaymentLines),
    //batchFile: one(/* tu tabla lote */),
  }),
);

export const supplierPaymentLinesRelations = relations(
  supplierPaymentLines,
  ({ one }) => ({
    payment: one(supplierPayments, {
      fields: [supplierPaymentLines.supplierPaymentId],
      references: [supplierPayments.id],
    }),
    accountsPayable: one(accountsPayable, {
      fields: [supplierPaymentLines.accountsPayableId],
      references: [accountsPayable.id],
    }),
  }),
);
