import { accountingBalancesLoader } from '@/features/accounting-balances/loaders/accounting-balances-loader';
import AccountingBalancesPage from '@/features/accounting-balances/pages/accounting-balances-page';
import type { Route } from '../+types/accounting-balances';

export const clientLoader = accountingBalancesLoader;

export default function Route() {
  return <AccountingBalancesPage />;
}
