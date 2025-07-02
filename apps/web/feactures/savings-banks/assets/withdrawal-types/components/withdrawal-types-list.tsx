'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useWithdrawalTypes } from '../hooks/use-query-withdrawal-types';
import { columns } from './withdrawal-types-tables/columns';

interface WithdrawalTypesListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
}

export default function WithdrawalTypesList({
  initialPage,
  initialSearch,
  initialLimit,
}: WithdrawalTypesListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
  };

  const { data, isLoading } = useWithdrawalTypes(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={initialLimit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      totalItems={data?.meta.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
