import { paymentBatchItems } from '@/database/schema/tables/savings';
import { InferSelectModel } from 'drizzle-orm';

export type PaymentBatchItem = InferSelectModel<typeof paymentBatchItems>;
