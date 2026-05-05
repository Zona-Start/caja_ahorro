import { accountingCyclesLoader } from '@/features/accounting-cycles/loaders/accounting-cycles-loader';
import AccountingCyclesPage from '@/features/accounting-cycles/pages/accounting-cycles-page';
import type { Route } from '../+types/accounting-cycles';

export const clientLoader = accountingCyclesLoader;

export default function Route() {
  return <AccountingCyclesPage />;
}
