'use client';

import { DataTable } from '@repo/shadcn/table/data-table';

import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { useQueryWithdrawal } from '../hooks/use-query-withdrawal';
import { columns } from './withdrawal-tables/columns';

interface WithdrawaltListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialType?: string | null;
  initialStatus?: string | null;
}

export default function WithdrawalList({
  initialPage,
  initialSearch,
  initialLimit,
  initialType,
  initialStatus,
}: WithdrawaltListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialType && { type: initialType }),
    ...(initialStatus && { status: initialStatus }),
  };

  const { data, isLoading } = useQueryWithdrawal(filters);

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
