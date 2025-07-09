'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useSalesProductCategories } from '../hooks/use-query-sales-product-categories';
import { columns } from './sales-product-categories-tables/columns';

interface SalesProductCategoriesListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
}

export default function SalesProductCategoriesList({
  initialPage,
  initialSearch,
  initialLimit,
}: SalesProductCategoriesListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
  };

  const { data, isLoading } = useSalesProductCategories(filters);

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
