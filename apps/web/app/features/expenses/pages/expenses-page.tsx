import { ExpenseHeader } from '../components/expense-header';
import { ExpenseList } from '../components/expense-list';
import { ExpenseModal } from '../components/expense-modal';

export default function ExpensesPage() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <ExpenseHeader />
      <ExpenseList />
      <ExpenseModal />
    </div>
  );
}
