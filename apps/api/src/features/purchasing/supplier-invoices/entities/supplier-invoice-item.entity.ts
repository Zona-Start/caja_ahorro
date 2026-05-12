import { supplierInvoiceItems } from '@/database/schema';
import { InferSelectModel } from 'drizzle-orm';

export type SupplierInvoiceItem = InferSelectModel<typeof supplierInvoiceItems>;
