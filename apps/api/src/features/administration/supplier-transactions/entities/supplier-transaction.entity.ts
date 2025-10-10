import { supplierTransactions } from '@/database';
import { InferInsertModel } from 'drizzle-orm';

export type SupplierTransaction = InferInsertModel<typeof supplierTransactions>;
