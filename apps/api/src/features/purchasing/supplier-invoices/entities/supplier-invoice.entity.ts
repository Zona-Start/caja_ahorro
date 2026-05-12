import { supplierInvoices } from '@/database/schema';
import { InferSelectModel } from 'drizzle-orm';

export type SupplierInvoice = InferSelectModel<typeof supplierInvoices>;
