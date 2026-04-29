'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { columns } from './tables/columns';
import { usePaginatedAccountingEntries } from '../hooks/use-query-accounting-entry';

interface AccountingEntryListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialStatus?: string | null;
  initialCycleId?: number | null;
}

export default function AccountingEntryList({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
  initialCycleId,
}: AccountingEntryListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialStatus && { status: initialStatus }),
    ...(initialCycleId && { accountingCycleId: initialCycleId }),
  };

  const { data, isLoading } = usePaginatedAccountingEntries(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={initialLimit} />;
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
