'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useSuppliers } from '../hooks/use-query-suppliers';
import { columns } from './suppliers-tables/columns';

interface ListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialStatus?: string | null;
  initialCategory?: string | null;
}

export default function SupplierList({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
  initialCategory,
}: ListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialStatus && { status: initialStatus }),
    ...(initialCategory && { category: initialCategory }),
  };

  const { data, isLoading } = useSuppliers(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={initialLimit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data || []}
      totalItems={data?.meta.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
