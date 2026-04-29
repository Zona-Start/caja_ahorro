'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useServices } from '../hooks/use-query-service';
import { columns } from './service-tables/columns';

interface ServiceListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialStatus?: string | null;
  initialCategoryId?: number | null;
}

export default function ServiceList({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
  initialCategoryId,
}: ServiceListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialStatus && { status: initialStatus }),
    ...(initialCategoryId && { categoryId: initialCategoryId }),
  };

  const { data, isLoading } = useServices(filters);

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
