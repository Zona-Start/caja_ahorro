import { purchaseOrderItems } from '@/database/schema';
import { InferInsertModel } from 'drizzle-orm';

export type PurchaseOrderItem = InferInsertModel<typeof purchaseOrderItems>;
