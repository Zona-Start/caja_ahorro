import { supplierInvoices } from '@/database/';
import { InferInsertModel } from 'drizzle-orm';

export type SupplierInvoice = InferInsertModel<typeof supplierInvoices>;
