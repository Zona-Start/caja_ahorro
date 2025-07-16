import {
  boolean,
  date,
  index,
  integer,
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
  invoiceSuppliersStatusEnum,
  paymentMethodEnum,
  paymentSuppliersStatusEnum,
  purchaseItemTypeEnum,
  purchaseTypeEnum,
  statusSuppliers,
} from './enum';
import { fixedAssets, salesProducts } from './inventory';
import { accountsPayableSchema } from './schemas';

// tabla proveedores
export const suppliers = accountsPayableSchema.table(
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

//Tabla accounts_payable (Cuentas por Pagar / Facturas)
export const accountsPayable = accountsPayableSchema.table(
  'accounts_payable',
  {
    id: serial('id').primaryKey(),
    supplierId: integer('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(), // Número de factura o documento
    invoiceDate: date('invoice_date').notNull(),
    dueDate: date('due_date').notNull(),
    totalAmount: numeric('total_amount', { precision: 18, scale: 2 }).notNull(),
    concept: text('concept').notNull(),
    paidAmount: numeric('paid_amount', { precision: 18, scale: 2 })
      .notNull()
      .default('0.00'), // Monto ya pagado
    remainingAmount: numeric('remaining_amount', {
      precision: 20,
      scale: 6,
    }).notNull(), // Saldo pendiente
    currencyCode: currencyCodeEnum('currency_code').notNull(),
    status: invoiceSuppliersStatusEnum('status').notNull().default('PENDING'),
    observations: text('observations'),
    // Referencia al asiento contable (entrada_contables) si se registra al recibir la factura.
    // Esto es un débito a una cuenta de gastos y un crédito a Cuentas por Pagar (Pasivo).
    // accountingEntryId: integer('accounting_entry_id').references(() => entradaContables.id),
    ...timestamps,
  },
  (table) => ({
    payableInvoiceUnique: uniqueIndex('ap_invoice_uidx').on(
      table.supplierId,
      table.invoiceNumber,
    ), // Factura única por proveedor y compañía
    payableStatusIdx: index('ap_status_idx').on(table.status),
    payableDueDateIdx: index('ap_due_date_idx').on(table.dueDate),
  }),
);

//Tabla ap_payments (Pagos de Cuentas por Pagar)
export const apPayments = accountsPayableSchema.table(
  'ap_payments',
  {
    id: serial('id').primaryKey(),
    payableId: integer('payable_id')
      .notNull()
      .references(() => accountsPayable.id),
    paymentDate: date('payment_date').notNull(),
    amountPaid: numeric('amount_paid', { precision: 18, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    transactionReference: varchar('transaction_reference', {
      length: 255,
    }).notNull(), // Referencia bancaria, número de cheque, etc.
    // Nuevo estado para la reversión y el flujo de pagos
    status: paymentSuppliersStatusEnum('status').notNull().default('REQUESTED'),
    observations: text('observations'),
    // Referencia al asiento contable (entrada_contables) generado por este pago.
    // Esto es un débito a Cuentas por Pagar (Pasivo) y un crédito a Caja/Banco (Activo).
    // accountingEntryId: integer('accounting_entry_id').references(() => entradaContables.id),
    isReversed: boolean('is_reversed').notNull().default(false), // Flag para indicar si este pago fue revertido
    ...timestamps,
  },
  (table) => ({
    paymentPayableIdx: index('payment_payable_idx').on(table.payableId),
    paymentDateIdx: index('payment_date_idx').on(table.paymentDate),
  }),
);

//Tabla purchase_orders (Pedidos/Facturas de Compra)
export const purchaseOrders = accountsPayableSchema.table(
  'purchase_orders',
  {
    id: serial('id').primaryKey(),
    supplierId: integer('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(), // Número de factura del proveedor
    purchaseDate: date('purchase_date').notNull(),
    totalAmount: numeric('total_amount', { precision: 18, scale: 2 }).notNull(),
    currencyCode: currencyCodeEnum('currency_code').notNull(), // Usando tu enum existente
    purchaseType: purchaseTypeEnum('purchaseType').notNull(),

    // Si la compra es a crédito, se relaciona con Cuentas por Pagar.
    // Si es una compra al contado, esto podría ser nulo.
    payableId: integer('payable_id').references(() => accountsPayable.id, {
      onDelete: 'set null',
    }),

    status: invoiceSuppliersStatusEnum('status').notNull().default('PENDING'), // Utiliza el enum de cuentas por pagar: PENDING, PAID, CANCELLED, etc.
    description: text('description'),

    // Campos para auditoría y tiempo
    ...timestamps,
  },
  (table) => ({
    // Índice para asegurar que el número de factura sea único por proveedor
    purchaseOrderInvoiceIdx: uniqueIndex('purchase_order_invoice_uidx').on(
      table.supplierId,
      table.invoiceNumber,
    ),
  }),
);

//Tabla purchase_items (Ítems Comprados)
export const purchaseItems = accountsPayableSchema.table('purchase_items', {
  id: serial('id').primaryKey(),
  purchaseOrderId: integer('purchase_order_id')
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: 'cascade' }),

  // Tipo de ítem (inventario, activo fijo, gasto)
  itemType: purchaseItemTypeEnum('item_type').notNull(),

  // Datos genéricos del ítem comprado
  itemName: varchar('item_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitCost: numeric('unit_cost', { precision: 18, scale: 6 }).notNull(),
  totalCost: numeric('total_cost', { precision: 18, scale: 2 }).notNull(),

  // --- Relación Condicional con los Tipos de Inventario ---

  // Si itemType = 'SALES_INVENTORY', este campo se relaciona con salesProducts.
  salesProductId: integer('sales_product_id').references(
    () => salesProducts.id,
    { onDelete: 'set null' },
  ),

  // Si itemType = 'FIXED_ASSET', este campo se relaciona con fixedAssets.
  // Aunque el activo se registre en fixedAssets, el registro de la compra se hace aquí.
  fixedAssetId: integer('fixed_asset_id').references(() => fixedAssets.id, {
    onDelete: 'set null',
  }),

  // Si itemType = 'EXPENSE', se podría relacionar con una cuenta contable específica para gastos (ej., 'Suministros de Oficina').
  // expenseAccountId: integer('expense_account_id').references(() => accountPlan.id, { onDelete: 'set null' }),

  // Campos para auditoría
  ...timestamps,
});
