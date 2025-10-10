import { purchaseOrders } from '@/database';
import { InferInsertModel } from 'drizzle-orm';

export type PurchaseOrder = InferInsertModel<typeof purchaseOrders>;
