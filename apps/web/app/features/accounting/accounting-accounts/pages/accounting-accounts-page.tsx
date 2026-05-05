import PageContainer from '@/components/shared/page-container';
import { AccountPlanHeader } from '../components/account-plan-header';
import AccountingAccountsList from '../components/accounting-accounts-list';
import AccountsTableAction from '../components/accounts-tables/accounts-table-action';

export default function AccountingAccountsPage() {
  return (
      <div className="flex flex-1 flex-col space-y-4">
        <AccountPlanHeader />
        <AccountsTableAction />
        <AccountingAccountsList />
      </div>
  );
}
