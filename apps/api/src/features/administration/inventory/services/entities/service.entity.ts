import { services } from '@/database';
import { InferInsertModel } from 'drizzle-orm';

export type Service = InferInsertModel<typeof services>;
