import { supplierTransactions } from '@/database/schema';
import { InferInsertModel } from 'drizzle-orm';

export type SupplierTransaction = InferInsertModel<typeof supplierTransactions>;
