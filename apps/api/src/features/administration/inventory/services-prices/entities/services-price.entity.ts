import { servicePrices } from '@/database';
import { InferInsertModel } from 'drizzle-orm';

export type ServicePrice = InferInsertModel<typeof servicePrices>;
