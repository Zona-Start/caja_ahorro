import { queryClient } from '@/lib/query-client';
import { accountingRulesLoader } from '@/features/accounting/accounting-rules/loaders/accounting-rules-loader';
import AccountingRulesPage from '@/features/accounting/accounting-rules/pages/accounting-rules-page';

export const clientLoader = accountingRulesLoader(queryClient);

export default function Route() {
  return <AccountingRulesPage />;
}
