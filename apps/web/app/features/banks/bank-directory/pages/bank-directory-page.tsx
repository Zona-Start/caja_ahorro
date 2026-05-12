import { BankDirectoryHeader } from '../components/bank-directory-header';
import BanksList from '../components/banks-list';
import BanksTableAction from '../components/banks-tables/banks-table-action';

export default function BankDirectoryPage() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <BankDirectoryHeader />
      <BanksTableAction />
      <BanksList />
    </div>
  );
}
