import { services } from '@/database/schema/administration';
import { InferInsertModel } from 'drizzle-orm';

export type Service = InferInsertModel<typeof services>;
