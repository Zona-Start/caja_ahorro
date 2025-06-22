'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { columns } from './settlement-tables/columns';
import { useQuerySettlement } from '../hooks/use-query-settlement';
import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';

interface SettlementtListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialType?: string | null;
}

export default function SettlementList({
  initialPage,
  initialSearch,
  initialLimit,
}: SettlementtListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
  };

  const { data, isLoading } = useQuerySettlement(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={initialLimit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data || []}
      totalItems={data?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
