import { InferSelectModel } from 'drizzle-orm';
import { paymentBatches } from '@/database/schema/savings-banks';

export type PaymentBatch = InferSelectModel<typeof paymentBatches>;
