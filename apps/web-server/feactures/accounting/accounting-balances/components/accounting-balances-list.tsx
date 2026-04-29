'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { usePaginatedAccountingBalances } from '../hooks/use-query-accounting-balance';
import { columns } from './tables/columns';

interface AccountingBalancesListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
}

export default function AccountingBalancesList({
  initialPage,
  initialSearch,
  initialLimit,
}: AccountingBalancesListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
  };

  const { data, isLoading } = usePaginatedAccountingBalances(filters);

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
