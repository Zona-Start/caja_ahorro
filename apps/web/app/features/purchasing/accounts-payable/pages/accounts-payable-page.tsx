import { AccountsPayableHeader } from '../components/accounts-payable-header';
import AccountsPayableList from '../components/accounts-payable-list';
import AccountsPayableTableAction from '../components/accounts-payable-tables/accounts-payable-table-action';

export default function AccountsPayablePage() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <AccountsPayableHeader />
      <AccountsPayableTableAction />
      <AccountsPayableList />
    </div>
  );
}
