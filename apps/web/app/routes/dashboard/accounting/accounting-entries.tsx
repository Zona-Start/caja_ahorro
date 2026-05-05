import { accountingEntriesLoader } from '@/features/accounting-entries/loaders/accounting-entries-loader';
import AccountingEntriesPage from '@/features/accounting-entries/pages/accounting-entries-page';
import type { Route } from '../+types/accounting-entries';

export const clientLoader = accountingEntriesLoader;

export default function Route() {
  return <AccountingEntriesPage />;
}
