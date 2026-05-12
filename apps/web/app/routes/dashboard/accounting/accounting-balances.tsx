import { accountingBalancesLoader } from '@/features/accounting/accounting-balances/loaders/accounting-balances-loader';
import AccountingBalancesPage from '@/features/accounting/accounting-balances/pages/accounting-balances-page';

export const clientLoader = accountingBalancesLoader;

export default function Route() {
  return <AccountingBalancesPage />;
}
