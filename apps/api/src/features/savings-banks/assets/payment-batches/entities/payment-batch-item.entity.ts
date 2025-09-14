import { InferSelectModel } from 'drizzle-orm';
import { paymentBatchItems } from '@/database/schema/savings-banks';

export type PaymentBatchItem = InferSelectModel<typeof paymentBatchItems>;
