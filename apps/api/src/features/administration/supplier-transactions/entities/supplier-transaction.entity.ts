import { supplierTransactions } from '@/database/schema/administration';
import { InferInsertModel } from 'drizzle-orm';

export type SupplierTransaction = InferInsertModel<typeof supplierTransactions>;
