
import { accountingAccountsLoader } from '@/features/accounting/accounting-accounts/loaders/accounting-accounts-loader';
import AccountingAccountsPage from '@/features/accounting/accounting-accounts/pages/accounting-accounts-page';
import type { Route } from '../+types/accounting-accounts';


export const clientLoader: Route['clientLoader'] = accountingAccountsLoader;

export default function Route() {
  return <AccountingAccountsPage />;
}
