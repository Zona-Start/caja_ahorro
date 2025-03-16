'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { usePaginatedBanksQuery } from '../hooks/use-banks-querys';
import { columns } from './banks-tables/columns';

interface BanksListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
}

export default function BanksList({
  initialPage,
  initialSearch,
  initialLimit,
}: BanksListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
  };

  const { data, isLoading } = usePaginatedBanksQuery(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={3} rowCount={initialLimit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data || []}
      totalItems={data?.meta.totalPages || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
