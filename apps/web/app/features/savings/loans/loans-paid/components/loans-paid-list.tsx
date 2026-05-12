'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useLoansPaidQuery } from '../hooks/use-loans-paid-query';
import { columns } from './loans-paid-tables/columns';

interface LoansPaidListProps {
  page: number;
  search?: string | null;
  limit: number;
  bank?: string | null;
  type?: string | null;
  method?: string | null;
}

export function LoansPaidList({
  page,
  search,
  limit,
}: LoansPaidListProps) {
  const { data, isLoading } = useLoansPaidQuery({
    page,
    limit,
    ...(search && { search }),
  });

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={limit} />;
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
