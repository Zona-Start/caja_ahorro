import { supplierInvoiceItems } from '@/database/schema/administration';
import { InferInsertModel } from 'drizzle-orm';

export type SupplierInvoiceItem = InferInsertModel<typeof supplierInvoiceItems>;
