'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useInventoryCategories } from '../hooks/use-query-inventory-categories';
import { columns } from './inventory-categories-tables/columns';

interface InventoryCategoriesListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialGroup?: string | null;
}

export default function InventoryCategoriesList({
  initialPage,
  initialSearch,
  initialLimit,
  initialGroup,
}: InventoryCategoriesListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialGroup && { group: initialGroup }),
  };

  const { data, isLoading } = useInventoryCategories(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={3} rowCount={initialLimit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      totalItems={data?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
