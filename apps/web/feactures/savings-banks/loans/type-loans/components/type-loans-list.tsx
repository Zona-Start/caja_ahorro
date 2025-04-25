'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { usePaginatedTypeLoans } from '../hooks/use-query-type-loans';
import { columns } from './type-loans-tables/columns';

interface TypeLoansListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
}

export default function TypeLoansList({
  initialPage,
  initialSearch,
  initialLimit,
}: TypeLoansListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
  };

  const { data, isLoading } = usePaginatedTypeLoans(filters);

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
