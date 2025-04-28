'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useTypeOperationsPaginated } from '../hooks/use-query-type-operations';
import { columns } from './type-operations-tables/columns';

interface TypeOperationsListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialGroup?: string | null;
}

export default function TypeOperationsList({
  initialPage,
  initialSearch,
  initialLimit,
  initialGroup,
}: TypeOperationsListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialGroup && { group: initialGroup }),
  };

  const { data, isLoading } = useTypeOperationsPaginated(filters);

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
