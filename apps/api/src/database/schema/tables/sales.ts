import { boolean, integer, jsonb, numeric, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { salesSchema } from "../_schemas";
import { timestamps } from "../timestamps";
import { deliveryNoteStatusEnum, fiscalStatusEnum, salesInvoiceStatusEnum, salesOrderStatusEnum, salesQuoteStatusEnum } from "../enum/sales.enum";

//(Maestro de Clientes)
export const customers = salesSchema.table('customers', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    taxId: varchar('tax_id', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    address: text('address'),
    creditDays: integer('credit_days').default(0).notNull(),
    creditLimit: numeric('credit_limit', { precision: 15, scale: 2 }).default('0.00').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
});

//(Cotizaciones / Presupuestos)
export const salesQuotes = salesSchema.table('sales_quotes', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    customerId: uuid('customer_id').notNull().references(() => customers.id),
    quoteNumber: varchar('quote_number', { length: 50 }).notNull(),
    status: salesQuoteStatusEnum('status').default('DRAFT').notNull(),
    issueDate: timestamp('issue_date', { withTimezone: true }).notNull(),
    validUntil: timestamp('valid_until', { withTimezone: true }).notNull(),
    currencyId: uuid('currency_id').notNull(),
    exchangeRate: numeric('exchange_rate', { precision: 12, scale: 4 }).default('1.0000').notNull(),
    subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
    taxAmount: numeric('tax_amount', { precision: 15, scale: 2 }).notNull(),
    totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
    notes: text('notes'),
    ...timestamps,
});


//(Cotizaciones / Presupuestos)
export const salesQuoteItems = salesSchema.table('sales_quote_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    quoteId: uuid('quote_id').notNull().references(() => salesQuotes.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull(),
    quantity: numeric('quantity', { precision: 12, scale: 4 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
    taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0.00').notNull(),
    totalPrice: numeric('total_price', { precision: 15, scale: 2 }).notNull(),
});


//(Pedidos / Órdenes de Venta)
export const salesOrders = salesSchema.table('sales_orders', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    customerId: uuid('customer_id').notNull().references(() => customers.id),
    quoteId: uuid('quote_id').references(() => salesQuotes.id),
    orderNumber: varchar('order_number', { length: 50 }).notNull(),
    status: salesOrderStatusEnum('status').default('DRAFT').notNull(),
    issueDate: timestamp('issue_date', { withTimezone: true }).notNull(),
    currencyId: uuid('currency_id').notNull(),
    exchangeRate: numeric('exchange_rate', { precision: 12, scale: 4 }).default('1.0000').notNull(),
    subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
    taxAmount: numeric('tax_amount', { precision: 15, scale: 2 }).notNull(),
    totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
    notes: text('notes'),
    ...timestamps,
});


//(Pedidos / Órdenes de Venta)
export const salesOrderItems = salesSchema.table('sales_order_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').notNull().references(() => salesOrders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull(),
    quantity: numeric('quantity', { precision: 12, scale: 4 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
    taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0.00').notNull(),
    totalPrice: numeric('total_price', { precision: 15, scale: 2 }).notNull(),
});


//(Facturación de Ventas)
export const salesInvoices = salesSchema.table('sales_invoices', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    customerId: uuid('customer_id').notNull().references(() => customers.id),
    orderId: uuid('order_id').references(() => salesOrders.id),
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
    status: salesInvoiceStatusEnum('status').default('DRAFT').notNull(),
    issueDate: timestamp('issue_date', { withTimezone: true }).notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    currencyId: uuid('currency_id').notNull(),
    exchangeRate: numeric('exchange_rate', { precision: 12, scale: 4 }).default('1.0000').notNull(),
    subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
    taxAmount: numeric('tax_amount', { precision: 15, scale: 2 }).notNull(),
    totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
    paidAmount: numeric('paid_amount', { precision: 15, scale: 2 }).default('0.00').notNull(),
    notes: text('notes'),
    fiscalNumber: varchar('fiscal_number', { length: 50 }),
    fiscalSerial: varchar('fiscal_serial', { length: 100 }),
    fiscalZReport: varchar('fiscal_z_report', { length: 50 }),
    fiscalStatus: fiscalStatusEnum('fiscal_status').default('PENDING').notNull(),
    fiscalResponse: jsonb('fiscal_response'),
    deliveryNoteId: uuid('delivery_note_id').references(() => salesDeliveryNotes.id),
    ...timestamps,
});

//(Facturación de Ventas)
export const salesInvoiceItems = salesSchema.table('sales_invoice_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    invoiceId: uuid('invoice_id').notNull().references(() => salesInvoices.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull(),
    quantity: numeric('quantity', { precision: 12, scale: 4 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
    unitCost: numeric('unit_cost', { precision: 15, scale: 2 }).notNull(), // Congela el costo promedio al momento de facturar
    taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0.00').notNull(),
    totalPrice: numeric('total_price', { precision: 15, scale: 2 }).notNull(),
});

//(Registro de Cobros)
export const customerPayments = salesSchema.table('customer_payments', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    customerId: uuid('customer_id').notNull().references(() => customers.id),
    paymentNumber: varchar('payment_number', { length: 50 }).notNull(),
    paymentDate: timestamp('payment_date', { withTimezone: true }).notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    currencyId: uuid('currency_id').notNull(),
    exchangeRate: numeric('exchange_rate', { precision: 12, scale: 4 }).default('1.0000').notNull(),
    paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
    referenceNumber: varchar('reference_number', { length: 100 }),
    notes: text('notes'),
    ...timestamps,
});

//(Cruce de Pagos vs Facturas)
export const customerPaymentApplications = salesSchema.table('customer_payment_applications', {
    id: uuid('id').defaultRandom().primaryKey(),
    paymentId: uuid('payment_id').notNull().references(() => customerPayments.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id').notNull().references(() => salesInvoices.id),
    amountApplied: numeric('amount_applied', { precision: 15, scale: 2 }).notNull(),
});

// --- NUEVA TABLA: NOTAS DE ENTREGA ---
export const salesDeliveryNotes = salesSchema.table('sales_delivery_notes', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    customerId: uuid('customer_id').notNull().references(() => customers.id),
    orderId: uuid('order_id').references(() => salesOrders.id),
    deliveryNumber: varchar('delivery_number', { length: 50 }).notNull(), // Ej: NE-00001
    status: deliveryNoteStatusEnum('status').default('DRAFT').notNull(),
    issueDate: timestamp('issue_date', { withTimezone: true }).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const salesDeliveryNoteItems = salesSchema.table('sales_delivery_note_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    deliveryNoteId: uuid('delivery_note_id').notNull().references(() => salesDeliveryNotes.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull(),
    quantity: numeric('quantity', { precision: 12, scale: 4 }).notNull(),
});