import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useCategoriesFilters } from '../hooks/use-categories-filters';
import { useCategoriesQuery } from '../hooks/use-categories-queries';
import { CategoriesHeader } from './categories-header';
import { CategoriesModal } from './categories-modal';
import { categoriesColumns } from './categories-tables/columns';
import { CategoriesTableAction } from './categories-tables/categories-table-action';
import { useCategoriesModalStore } from '../store/categories-modal.store';

export default function CategoriesList() {
  const { filters } = useCategoriesFilters();
  const { data, isLoading } = useCategoriesQuery(filters);
  const { isOpen, mode, data: modalData, closeModal } = useCategoriesModalStore();

  if (isLoading) {
    return <DataTableSkeleton columnCount={4} rowCount={filters.limit} />;
  }

  const categoriesData = data?.data || [];

  return (
    <div className="space-y-4">
      <CategoriesHeader />
      <CategoriesTableAction />
      <DataTable
        columns={categoriesColumns}
        data={categoriesData}
        totalItems={data?.total || 0}
        pageSizeOptions={[10, 20, 50]}
      />
      <CategoriesModal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        defaultValues={modalData}
        mode={mode}
      />
    </div>
  );
}
