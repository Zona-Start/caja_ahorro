import { BankAccountHeader } from '../components/bank-account-header';
import BankAccountList from '../components/bank-account-list';
import BankAccountTableAction from '../components/bank-account-tables/bank-account-table-action';

export default function BankAccountPage() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <BankAccountHeader />
      <BankAccountTableAction />
      <BankAccountList />
    </div>
  );
}
