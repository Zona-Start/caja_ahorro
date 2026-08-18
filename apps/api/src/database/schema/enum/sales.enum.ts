import { salesSchema } from "../_schemas";

export const salesQuoteStatusEnum = salesSchema.enum('sales_quote_status', [
    'DRAFT',
    'SENT',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED',
]);

export const salesOrderStatusEnum = salesSchema.enum('sales_order_status', [
    'DRAFT',
    'CONFIRMED',
    'PROCESSING',
    'COMPLETED',
    'CANCELLED',
]);

export const salesInvoiceStatusEnum = salesSchema.enum('sales_invoice_status', [
    'DRAFT',
    'ISSUED',
    'PAID',
    'PARTIALLY_PAID',
    'CANCELLED',
]);

export const fiscalStatusEnum = salesSchema.enum('fiscal_status', [
    'PENDING',
    'PRINTED',
    'ERROR',
]);

export const deliveryNoteStatusEnum = salesSchema.enum('delivery_note_status', [
    'DRAFT',
    'DISPATCHED',
    'INVOICED',
    'CANCELLED',
]);