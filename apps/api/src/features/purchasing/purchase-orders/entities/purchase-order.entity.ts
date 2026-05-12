import { purchaseOrders } from '@/database/schema';
import { InferInsertModel } from 'drizzle-orm';

export type PurchaseOrder = InferInsertModel<typeof purchaseOrders>;
