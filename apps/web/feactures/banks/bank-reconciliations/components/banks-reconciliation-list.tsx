'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useBanksReconciliationQuery } from '../hooks/use-query-bank-reconciliations';
import { columns } from './banks-reconciliation/columns';

interface BanksListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
}

export default function BanksReconciliationList({
  initialPage,
  initialSearch,
  initialLimit,
}: BanksListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
  };

  const { data, isLoading } = useBanksReconciliationQuery(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={3} rowCount={initialLimit} />;
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
