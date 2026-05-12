import { bankTransactions } from '@/database/schema';
import { InferSelectModel } from 'drizzle-orm';

export type BankMovement = InferSelectModel<typeof bankTransactions>;
