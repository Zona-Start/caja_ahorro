import { accountsPayable } from '@/database/schema/administration';
import { InferInsertModel } from 'drizzle-orm';

export type AccountPayable = InferInsertModel<typeof accountsPayable>;
