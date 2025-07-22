import { purchaseOrderItems } from '@/database/schema/administration';
import { InferInsertModel } from 'drizzle-orm';

export type PurchaseOrderItem = InferInsertModel<typeof purchaseOrderItems>;
