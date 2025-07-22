import { supplierInvoices } from '@/database/schema/administration';
import { InferInsertModel } from 'drizzle-orm';

export type SupplierInvoice = InferInsertModel<typeof supplierInvoices>;
