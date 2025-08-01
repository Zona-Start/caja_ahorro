import { servicePrices } from '@/database/schema/administration';
import { InferInsertModel } from 'drizzle-orm';

export type ServicePrice = InferInsertModel<typeof servicePrices>;
