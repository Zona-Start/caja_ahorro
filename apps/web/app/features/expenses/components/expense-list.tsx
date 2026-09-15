import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useExpenseFilters } from '../hooks/use-expense-filters';
import { useExpensesQuery } from '../hooks/use-expense-queries';
import type { Expense } from '../schemas/expenses.schema';
import { expenseColumns } from './expense-table/expense-columns';

export function ExpenseList() {
  const { filters } = useExpenseFilters();
  const { data, isLoading } = useExpensesQuery(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={filters.limit} />;
  }

  const expenses = (data?.data || []) as unknown as Expense[];

  return (
    <DataTable
      columns={expenseColumns}
      data={expenses}
      totalItems={data?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
}
