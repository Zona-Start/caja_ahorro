'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useCreditsPaidQuery } from '../hooks/use-credits-paid-query';
import { columns } from './credits-paid-tables/columns';

interface CreditsPaidListProps {
  page: number;
  search?: string | null;
  limit: number;
  bank?: string | null;
  type?: string | null;
  method?: string | null;
}

export function CreditsPaidList({
  page,
  search,
  limit,
  bank,
  type,
  method,
}: CreditsPaidListProps) {
  const params: Record<string, unknown> = {
    page,
    limit,
    ...(search && { search }),
    ...(bank && { bank }),
    ...(type && { type }),
    ...(method && { method }),
  };

  const { data, isLoading } = useCreditsPaidQuery(params as {
    page: number;
    limit: number;
    search?: string;
    bank?: string;
    type?: string;
    method?: string;
  });

  if (isLoading) {
    return <DataTableSkeleton columnCount={10} rowCount={limit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data || []}
      totalItems={data?.meta?.totalItems || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
