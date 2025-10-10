import { purchaseOrderItems } from '@/database';
import { InferInsertModel } from 'drizzle-orm';

export type PurchaseOrderItem = InferInsertModel<typeof purchaseOrderItems>;
