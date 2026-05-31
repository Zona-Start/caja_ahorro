import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useCategoriesFilters } from '../hooks/use-categories-filters';
import { useCategoriesQuery } from '../hooks/use-categories-queries';
import { columns } from './tables/columns';
import { CategoriesHeader } from './categories-header';
import CategoriesTableAction from './tables/categories-table-action';

export default function CategoriesList() {
  const { filters } = useCategoriesFilters();
  const { data, isLoading } = useCategoriesQuery(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={filters.limit} />;
  }

  const categoriesData = data?.data || [];

  return (
    <div className="space-y-4">
      <CategoriesHeader />

      <CategoriesTableAction />

      <DataTable
        columns={columns}
        data={categoriesData}
        totalItems={data?.total || 0}
        pageSizeOptions={[10, 20, 30, 50]}
      />
    </div>
  );
}