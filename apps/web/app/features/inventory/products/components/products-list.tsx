import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useProductsFilters } from '../hooks/use-products-filters';
import { useProductsQuery } from '../hooks/use-products-queries';
import { columns } from './products-tables/columns';

export function ProductsList() {
  const { filters } = useProductsFilters();
  const { data, isLoading } = useProductsQuery(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={8} rowCount={filters.limit} />;
  }

  const productsData = data?.data ?? [];
  const totalItems = data?.meta?.totalCount ?? 0;

  return (
    <DataTable
      columns={columns}
      data={productsData}
      totalItems={totalItems}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
}
