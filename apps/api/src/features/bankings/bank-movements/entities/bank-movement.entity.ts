import { bankTransactions } from '@/database';
import { InferInsertModel } from 'drizzle-orm';

export type BankMovement = InferInsertModel<typeof bankTransactions>;
