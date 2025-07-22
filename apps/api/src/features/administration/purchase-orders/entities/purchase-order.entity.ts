import { purchaseOrders } from '@/database/schema/administration';
import { InferInsertModel } from 'drizzle-orm';

export type PurchaseOrder = InferInsertModel<typeof purchaseOrders>;
