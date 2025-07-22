'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useProducts } from '../hooks/use-query-product';
import { columns } from './product-tables/columns';

interface ProductListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialTypeCategory?: number | null;
  initialStatus?: string | null;
}

export default function ProductList({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
  initialTypeCategory,
}: ProductListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialTypeCategory && { typeCategory: initialTypeCategory }),
    ...(initialStatus && { status: initialStatus }),
  };

  const { data, isLoading } = useProducts(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={initialLimit} />;
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
