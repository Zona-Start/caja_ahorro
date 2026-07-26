import { BankReconciliationHeader } from '../components/bank-reconciliation-header';
import BankReconciliationList from '../components/bank-reconciliation-list';
import BankReconciliationTableAction from '../components/bank-reconciliation-table/bank-reconciliation-table-action';

export default function BankReconciliationPage() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <BankReconciliationHeader />
      <BankReconciliationTableAction />
      <BankReconciliationList />
    </div>
  );
}
