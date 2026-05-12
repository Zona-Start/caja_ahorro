'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { columns } from './settlement-tables/columns';
import { useQuerySettlement } from '../hooks/use-settlement-query';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';

interface SettlementListProps {
  page: number;
  search?: string | null;
  limit: number;
}

export function SettlementList({
  page,
  search,
  limit,
}: SettlementListProps) {
  const filters = {
    page,
    limit,
    ...(search && { search }),
  };

  const { data, isLoading } = useQuerySettlement(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={limit} />;
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
