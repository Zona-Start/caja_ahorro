


// --- DEFINICIÓN DE RELACIONES (DRIZZLE ORM) ---

import { relations } from "drizzle-orm";
import { customerPaymentApplications, customerPayments, customers, salesDeliveryNoteItems, salesDeliveryNotes, salesInvoiceItems, salesInvoices, salesOrders } from "../tables/sales";

export const customersRelations = relations(customers, ({ many }) => ({
    invoices: many(salesInvoices),
    orders: many(salesOrders),
    payments: many(customerPayments),
}));

export const salesInvoicesRelations = relations(salesInvoices, ({ one, many }) => ({
    customer: one(customers, { fields: [salesInvoices.customerId], references: [customers.id] }),
    order: one(salesOrders, { fields: [salesInvoices.orderId], references: [salesOrders.id] }),
    items: many(salesInvoiceItems),
    paymentApplications: many(customerPaymentApplications),
}));

export const salesInvoiceItemsRelations = relations(salesInvoiceItems, ({ one }) => ({
    invoice: one(salesInvoices, { fields: [salesInvoiceItems.invoiceId], references: [salesInvoices.id] }),
}));

export const customerPaymentsRelations = relations(customerPayments, ({ one, many }) => ({
    customer: one(customers, { fields: [customerPayments.customerId], references: [customers.id] }),
    applications: many(customerPaymentApplications),
}));

export const customerPaymentApplicationsRelations = relations(customerPaymentApplications, ({ one }) => ({
    payment: one(customerPayments, { fields: [customerPaymentApplications.paymentId], references: [customerPayments.id] }),
    invoice: one(salesInvoices, { fields: [customerPaymentApplications.invoiceId], references: [salesInvoices.id] }),
}));


// --- RELACIONES PARA NOTAS DE ENTREGA (CABECERA) ---
export const salesDeliveryNotesRelations = relations(salesDeliveryNotes, ({ one, many }) => ({
    customer: one(customers, {
        fields: [salesDeliveryNotes.customerId],
        references: [customers.id],
    }),
    order: one(salesOrders, {
        fields: [salesDeliveryNotes.orderId],
        references: [salesOrders.id],
    }),
    items: many(salesDeliveryNoteItems),
    invoices: many(salesInvoices),
}));

// --- RELACIONES PARA DETALLE DE NOTA DE ENTREGA ---
export const salesDeliveryNoteItemsRelations = relations(salesDeliveryNoteItems, ({ one }) => ({
    deliveryNote: one(salesDeliveryNotes, {
        fields: [salesDeliveryNoteItems.deliveryNoteId],
        references: [salesDeliveryNotes.id],
    }),
}));


// Relación inversa en Clientes
export const customersDeliveryNotesRelations = relations(customers, ({ many }) => ({
    deliveryNotes: many(salesDeliveryNotes),
}));

// Relación inversa en Pedidos de Venta
export const salesOrdersDeliveryNotesRelations = relations(salesOrders, ({ many }) => ({
    deliveryNotes: many(salesDeliveryNotes),
}));

// Relación en Facturas de Venta (si vinculas la factura a una Nota de Entrega origen)
export const salesInvoicesDeliveryNotesRelations = relations(salesInvoices, ({ one }) => ({
    deliveryNote: one(salesDeliveryNotes, {
        fields: [salesInvoices.deliveryNoteId], // Agregar 'deliveryNoteId' opcional en sales_invoices
        references: [salesDeliveryNotes.id],
    }),
}));