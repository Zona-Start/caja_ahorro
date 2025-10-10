import { accountsPayable } from '@/database';
import { InferInsertModel } from 'drizzle-orm';

export type AccountPayable = InferInsertModel<typeof accountsPayable>;
