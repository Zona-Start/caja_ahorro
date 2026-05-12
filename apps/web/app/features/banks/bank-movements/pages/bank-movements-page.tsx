import { BankMovementHeader } from '../components/bank-movement-header';
import BankMovementList from '../components/bank-movement-list';
import BankMovementTableAction from '../components/bank-movement-tables/bank-movement-table-action';

export default function BankMovementsPage() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <BankMovementHeader />
      <BankMovementTableAction />
      <BankMovementList />
    </div>
  );
}
