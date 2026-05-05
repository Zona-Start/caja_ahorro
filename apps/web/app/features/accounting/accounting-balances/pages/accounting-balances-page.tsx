import PageContainer from '@/components/shared/page-container';
import { AccountingBalanceHeader } from '../components/accounting-balance-header';
import AccountingBalancesList from '../components/accounting-balances-list';
import { AccountingBalanceTableAction } from '../components/tables/accounting-balance-table-action';

export default function AccountingBalancesPage() {
  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <AccountingBalanceHeader />
        <AccountingBalanceTableAction />
        <AccountingBalancesList />
      </div>
    </PageContainer>
  );
}
