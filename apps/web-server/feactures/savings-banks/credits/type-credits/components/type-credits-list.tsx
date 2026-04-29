'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { usePaginatedTypeCredits } from '../hooks/use-query-type-credits';
import { columns } from './type-credits-tables/columns';

interface TypeCreditsListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
}

export default function TypeCreditsList({
  initialPage,
  initialSearch,
  initialLimit,
}: TypeCreditsListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
  };

  const { data, isLoading } = usePaginatedTypeCredits(filters);

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
