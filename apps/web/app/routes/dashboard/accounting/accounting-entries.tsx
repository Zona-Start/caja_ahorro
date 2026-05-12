import { accountingEntriesLoader } from '@/features/accounting/accounting-entries/loaders/accounting-entries-loader';
import AccountingEntriesPage from '@/features/accounting/accounting-entries/pages/accounting-entries-page';

export const clientLoader = accountingEntriesLoader;

export default function Route() {
  return <AccountingEntriesPage />;
}
