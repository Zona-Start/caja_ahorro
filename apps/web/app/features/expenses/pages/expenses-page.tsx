import { Button } from '@repo/shadcn/button';
import { Tabs, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { Plus } from 'lucide-react';
import { ExpenseHeader } from '../components/expense-header';
import { ExpenseList } from '../components/expense-list';
import { ExpenseModal } from '../components/expense-modal';
import { useExpenseFilters } from '../hooks/use-expense-filters';
import { useExpenseModalStore } from '../store/expense-modal.store';

export default function ExpensesPage() {
  const { filters, setFilters } = useExpenseFilters();
  const { openModal } = useExpenseModalStore();
  const activeTab = filters.nature ?? 'ALL';

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <ExpenseHeader />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setFilters({
              nature: value === 'ALL' ? undefined : value,
              page: 1,
            })
          }
        >
          <TabsList>
            <TabsTrigger value="ALL">Todos</TabsTrigger>
            <TabsTrigger value="FIXED">Gastos Fijos</TabsTrigger>
            <TabsTrigger value="VARIABLE">Gastos Variables</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          onClick={() =>
            openModal(activeTab === 'FIXED' ? 'FIXED' : 'VARIABLE')
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Gasto
        </Button>
      </div>

      <ExpenseList />
      <ExpenseModal />
    </div>
  );
}
