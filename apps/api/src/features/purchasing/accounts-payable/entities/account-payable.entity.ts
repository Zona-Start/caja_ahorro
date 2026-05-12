import { accountsPayable } from '@/database/schema';
import { InferSelectModel } from 'drizzle-orm';

export type AccountPayable = InferSelectModel<typeof accountsPayable>;
