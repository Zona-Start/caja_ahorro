import { paymentBatches } from '@/database/schema/tables/savings-banks';
import { InferSelectModel } from 'drizzle-orm';

export type PaymentBatch = InferSelectModel<typeof paymentBatches>;
