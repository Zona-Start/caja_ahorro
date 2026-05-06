import { accountingCyclesLoader } from '@/features/accounting/accounting-cycles/loaders/accounting-cycles-loader';
import AccountingCyclesPage from '@/features/accounting/accounting-cycles/pages/accounting-cycles-page';

export const clientLoader = accountingCyclesLoader;

export default function Route() {
  return <AccountingCyclesPage />;
}
