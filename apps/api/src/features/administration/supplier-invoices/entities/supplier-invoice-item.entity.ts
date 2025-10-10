import { supplierInvoiceItems } from '@/database';
import { InferInsertModel } from 'drizzle-orm';

export type SupplierInvoiceItem = InferInsertModel<typeof supplierInvoiceItems>;
