import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@repo/shadcn/button';
import { Heading } from '@repo/shadcn/heading';
import { Input } from '@repo/shadcn/input';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ExpenseCategoryModal } from '../components/expense-category-modal';
import { expenseCategoryColumns } from '../components/expense-category-table/expense-category-columns';
import { useExpenseCategoriesQuery } from '../hooks/use-expense-categories-query';
import { useExpenseCategoryFilters } from '../hooks/use-expense-category-filters';

export default function ExpenseCategoriesPage() {
  const { filters, setFilters } = useExpenseCategoryFilters();
  const { data, isLoading } = useExpenseCategoriesQuery(filters);
  const [openCreate, setOpenCreate] = useState(false);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const [searchValue, setSearchValue] = useState(filters.search || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ search: value || undefined, page: 1 });
    }, 400);
  };

  const canCreate = hasPermission('treasury:expense-categories', 'create');

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Heading
          title="Categorías de Gasto"
          description="Clasifica los gastos e ilumina su imputación contable"
        />
        {canCreate && (
          <Button
            onClick={() => setOpenCreate(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
        )}
      </div>

      <Input
        placeholder="Buscar categorías..."
        value={searchValue}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="w-full sm:w-[300px]"
      />

      {isLoading ? (
        <DataTableSkeleton columnCount={4} rowCount={filters.limit} />
      ) : (
        <DataTable
          columns={expenseCategoryColumns}
          data={data?.data || []}
          totalItems={data?.meta?.totalCount || 0}
          pageSizeOptions={[10, 20, 30, 50]}
        />
      )}

      <ExpenseCategoryModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        mode="create"
      />
    </div>
  );
}
