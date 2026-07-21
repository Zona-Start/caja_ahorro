import {
  boolean,
  date,
  index,
  integer,
  numeric,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { timestamps } from '../../timestamps';
import { purchasingSchema } from '../_schemas';
import {
  currencyCodeEnum,
  invoiceSuppliersStatusEnum,
  paymentAccountsPayableEnum,
  paymentMethodEnum,
  paymentSupplierStatusEnum,
  purchaseOrderStatusEnum,
  purchaseOrderTypeEnum,
  statusSuppliers,
  supplierInvoicesPaymentEnum,
  supplierTransactionsTypeEnum,
} from '../enum';
import { accountPlan } from './accounting';
import { states } from './core';
import { tenants } from './tenants';
import { bankAccounts } from './treasury';
import { inventoryMovements, products } from './inventory';

// tabla proveedores
export const suppliers = purchasingSchema.table(
  'suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    internalCode: varchar('internal_code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(), // Nombre del proveedor
    taxId: varchar('tax_id', { length: 50 }).notNull(), // RIF, RUC, NIT, o equivalente fiscal
    phone: varchar('phone', { length: 50 }),
    email: varchar('email', { length: 255 }),
    contactName: varchar('contact_name', { length: 255 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 50 }),
    state: integer('state').references(() => states.id, {
      onDelete: 'set null',
    }),
    address: text('address'),
    category: varchar('category', { length: 50 }).notNull(),
    status: statusSuppliers('status').notNull().default('ACTIVE'), // Para proveedores que ya no usamos

    ...timestamps,
  },
  (table) => ({
    // Índice compuesto único para internalCode por tenant
    supplierTenantInternalCodeUnique: uniqueIndex('supplier_tenant_internal_code_unique')
      .on(table.tenantId, table.internalCode),

    // Índice compuesto único para taxId por tenant
    supplierTenantTaxUnique: uniqueIndex('supplier_tenant_tax_unique')
      .on(table.tenantId, table.taxId),

    // Índice normal para búsqueda rápida por nombre
    supplierNameIdx: index('supplier_name_idx').on(table.name),
  }),
);

//Tabla purchase_orders (Pedidos/Facturas de Compra)
export const purchaseOrders = purchasingSchema.table(
  'purchase_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    orderNumber: varchar('order_number', { length: 50 }).notNull(),
    status: purchaseOrderStatusEnum('status').notNull().default('DRAFT'), // Utiliza el enum de cuentas por pagar: PENDING, PAID, CANCELLED, etc.
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
    // Índice compuesto uni para asegurar que el número de factura sea único por tenants
    orderNumberIdx: uniqueIndex('po_order_number_idx').on(table.tenantId, table.orderNumber),


    // Índice para búsqueda por proveedor
    supplierIdx: index('po_supplier_idx').on(table.supplierId),

    // Índice para búsqueda por estado
    statusIdx: index('po_status_idx').on(table.status),

    // Índice para rango de fechas
    dateRangeIdx: index('po_date_range_idx').on(table.orderDate),

  }),
);

//Tabla purchase_items (Ítems Comprados)
export const purchaseOrderItems = purchasingSchema.table(
  'purchase_order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    purchaseOrderId: uuid('purchase_order_id')
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: 'cascade' }),
    lineType: purchaseOrderTypeEnum('line_type').notNull(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    itemId: uuid('itemId'),
    // Datos genéricos del ítem comprado
    description: varchar('description', { length: 255 }),
    quantity: numeric('quantity', { precision: 12, scale: 4 }).notNull(),
    quantityReceived: numeric('quantity_received', { precision: 12, scale: 4 }).notNull().default('0.0000'),
    quantityInvoiced: numeric('quantity_invoiced', { precision: 12, scale: 4 }).notNull().default('0.0000'),
    unitCost: numeric('unit_cost', { precision: 18, scale: 6 }).notNull(),
    totalCost: numeric('total_cost', { precision: 18, scale: 2 }).notNull(),
    ...timestamps,
  },
);

// TABLA RECEPCIÓN DE FACTURAS
export const supplierInvoices = purchasingSchema.table(
  'supplier_invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),

    /* puede venir de una orden de compra o ser “libre” */
    purchaseOrderId: uuid('purchase_order_id').references(
      () => purchaseOrders.id,
      { onDelete: 'set null' },
    ),
    supplierInvoiceNumber: varchar('supplier_invoice_number', { length: 50 })
      .notNull(),
    // VÍNCULO DIRECTO OPCIONAL A LA RECEPCIÓN DE ALMACÉN
    inventoryMovementId: uuid('inventory_movement_id').references(() => inventoryMovements.id, { onDelete: 'set null' }),
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

    paymentMethod: paymentMethodEnum('payment_method'),
    bankAccountId: uuid('bank_account_id').references(() => bankAccounts.id, {
      onDelete: 'set null',
    }),
    bankReference: varchar('bank_reference', { length: 100 }),

    status: invoiceSuppliersStatusEnum('status').notNull().default('DRAFT'),
    observations: text('observations'),

    /* FK opcional al asiento contable al recibir la factura */
    // accountingEntryId: integer('accounting_entry_id').references(() => entradaContables.id),

    ...timestamps,
  },
  (table) => ({
    invoiceUnique: uniqueIndex('si_invoice_unique_idx').on(
      table.tenantId,
      table.supplierInvoiceNumber,
    ),
    // Índice para buscar por proveedor
    supplierIdx: index('si_supplier_idx').on(table.supplierId),

    // Índice para buscar por estado
    statusIdx: index('si_status_idx').on(table.status),

    // Índice para rango de fechas
    dateRangeIdx: index('si_date_range_idx').on(table.invoiceDate),

    // Índice para buscar por número de factura
    invoiceNumberIdx: index('si_invoice_number_idx').on(table.invoiceNumber),
  }),
);

/* Líneas de la factura recibida */
export const supplierInvoiceItems = purchasingSchema.table(
  'supplier_invoice_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => supplierInvoices.id, { onDelete: 'cascade' }),

    lineType: purchaseOrderTypeEnum('line_type').notNull(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    itemId: uuid('item_id'), // Puede ser producto, servicio o activo fijo
    expenseAccountId: uuid('expense_account_id').references(
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
export const accountsPayable = purchasingSchema.table(
  'accounts_payable',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    supplierId: uuid('supplier_id').references(() => suppliers.id, {
      onDelete: 'cascade',
    }),
    supplierInvoiceId: uuid('supplier_invoice_id')
      .unique()
      .references(() => supplierInvoices.id, { onDelete: 'cascade' }),
    accountsPayableNumber: varchar('ap_number', { length: 50 })
      .notNull(),
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
    priority: varchar('priority', { length: 20 }).default('NORMAL'),
    isAuthorizePayment: boolean('is_authorize_payment').default(false),
    observations: text('observations'),
    // Referencia al asiento contable (entrada_contables) si se registra al recibir la factura.
    // Esto es un débito a una cuenta de gastos y un crédito a Cuentas por Pagar (Pasivo).
    // accountingEntryId: integer('accounting_entry_id').references(() => entradaContables.id),
    ...timestamps,
  },
  (table) => ({
    payableInvoiceUnique: uniqueIndex('payable_invoice_uidx').on(
      table.tenantId,
      table.accountsPayableNumber,
    ), // Factura única por proveedor y compañía

    payableStatusIdx: index('ap_status_idx').on(table.status),

    // Índice para buscar por proveedor
    supplierIdx: index('ap_supplier_idx').on(table.supplierId),

    // Índice para rango de fechas
    dateRangeIdx: index('ap_date_range_idx').on(table.dueDate),

    // Índice para búsqueda por número de factura
    invoiceNumberIdx: index('ap_invoice_number_idx').on(table.accountsPayableNumber),
  }),
);

export const supplierAdvances = purchasingSchema.table('supplier_advances', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  supplierAdvanceNumber: varchar('supplier_advance_number', { length: 50 })
    .notNull(),
  transactionId: uuid('transaction_id')
    .notNull()
    .references(() => supplierTransactions.id, { onDelete: 'cascade' }),
  supplierId: uuid('supplier_id')
    .notNull()
    .references(() => suppliers.id, { onDelete: 'cascade' }),
  amount: numeric('amount', {
    precision: 18,
    scale: 2,
  }).default('0.00'),
  availableAmount: numeric('available_amount', {
    precision: 18,
    scale: 2,
  }).default('0.00'),
  isAuthorizePayment: boolean('is_authorize_payment').default(false),
  statusPayment: varchar('status', {
    enum: ['PENDING', 'PAID'],
  }).default('PENDING'),
  ...timestamps,
},
  (table) => ({
    advanceUnique: uniqueIndex('advance_unique_uidx').on(
      table.tenantId,
      table.supplierAdvanceNumber,
    ),
  }),);

export const supplierCreditNotes = purchasingSchema.table(
  'supplier_credit_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => supplierTransactions.id, { onDelete: 'cascade' }),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    accountsPayableId: uuid('accounts_payable_id').references(
      () => accountsPayable.id,
    ),
    creditNoteNumber: varchar('credit_note_number', { length: 50 })
      .notNull(),
    reason: text('reason'),
    amount: numeric('amount', {
      precision: 18,
      scale: 2,
    }).default('0.00'),
    availableAmount: numeric('available_amount', {
      precision: 18,
      scale: 2,
    }).default('0.00'),
    ...timestamps,
  },
  (table) => ({
    creditNoteUnique: uniqueIndex('credit_note_unique_uidx').on(
      table.tenantId,
      table.creditNoteNumber,
    ),
  }),
);

export const supplierDebitNotes = purchasingSchema.table(
  'supplier_debit_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => supplierTransactions.id, { onDelete: 'cascade' }),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    accountsPayableId: uuid('accounts_payable_id')
      .notNull()
      .references(() => accountsPayable.id, { onDelete: 'cascade' }),
    debitNoteNumber: varchar('debit_note_number', { length: 50 })
      .notNull(),
    reason: text('reason'),
    amount: numeric('amount', {
      precision: 18,
      scale: 2,
    }).default('0.00'),
    ...timestamps,
  },
  (table) => ({
    debitNoteUnique: uniqueIndex('debit_note_unique_uidx').on(
      table.tenantId,
      table.debitNoteNumber,
    ),
  }),
);

export const supplierPayments = purchasingSchema.table('supplier_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  paymentNumber: varchar('payment_number', { length: 50 }).notNull(), // PAG-P-2025-000123
  supplierId: uuid('supplier_id')
    .notNull()
    .references(() => suppliers.id, { onDelete: 'cascade' }),

  totalAmount: numeric('total_amount', { precision: 18, scale: 2 }).notNull(),
  currencyCode: currencyCodeEnum('currency_code').notNull(),

  // datos del medio de pago
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  bankAccountId: uuid('bank_account_id').references(
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
  (table) => ({
    paymentUnique: uniqueIndex('payment_unique_uidx').on(
      table.tenantId,
      table.paymentNumber,
    ),
  }),);

export const supplierPaymentLines = purchasingSchema.table(
  'supplier_payment_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    supplierPaymentId: uuid('supplier_payment_id')
      .notNull()
      .references(() => supplierPayments.id, { onDelete: 'cascade' }),
    // puede apuntar a una CxP o ser un anticipo:
    accountsPayableId: uuid('accounts_payable_id').references(
      () => accountsPayable.id,
      { onDelete: 'cascade' },
    ),
    relatedAdvanceId: integer('related_advance_id'),
    amount: numeric('amount', { precision: 18, scale: 2 }).notNull(), // siempre positivo
    description: varchar('description', { length: 255 }),
    ...timestamps,
  },
);

export const supplierTransactions = purchasingSchema.table(
  'supplier_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),

    transactionNumber: varchar('transaction_number', { length: 50 })
      .notNull(),
    transactionType: supplierTransactionsTypeEnum('transaction_type').notNull(), // PAYMENT | CREDIT_NOTE | DEBIT_NOTE | ADVANCE
    transactionDate: date('transaction_date').notNull(),
    amount: numeric('amount', { precision: 18, scale: 2 }).notNull(), // siempre positivo
    currencyCode: currencyCodeEnum('currency_code').notNull(),
    status: varchar('status', {
      enum: ['ACTIVE', 'PARTIALLY_APPLIED', 'APPLIED', 'REVERSED'],
    })
      .notNull()
      .default('ACTIVE'),

    // Campos específicos para PAGOS/ANTICIPOS (siempre NULL para NC/ND)
    paymentMethod: paymentMethodEnum('payment_method'),
    bankAccountId: uuid('bank_account_id').references(() => bankAccounts.id),
    bankReference: varchar('bank_reference', { length: 100 }),
    bankTransactionDate: date('bank_transaction_date'),

    observations: text('observations'),
    ...timestamps,
  },
  (table) => ({
    // Índice único compuesto para el número de transacción (CRUCIAL)
    transactionNumberUnique: uniqueIndex('st_tn_comp_uidx').on(
      table.tenantId,
      table.transactionNumber,
    ),
  }),
);

export const supplierTransactionApplications = purchasingSchema.table(
  'supplier_transaction_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => supplierTransactions.id, { onDelete: 'cascade' }),
    accountsPayableId: uuid('accounts_payable_id')
      .notNull()
      .references(() => accountsPayable.id, { onDelete: 'cascade' }),
    appliedAmount: numeric('applied_amount', {
      precision: 18,
      scale: 2,
    }).notNull(),
    applicationDate: date('application_date').defaultNow(),
    ...timestamps,
  },
);
