'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useQueryLoansManagement } from '../hooks/use-loans-management-query';
import { columns } from './loans-tables/columns';

interface OrdinaryLoansListProps {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  type?: string;
  modality?: string;
}

export function OrdinaryLoansList({
  page,
  limit,
  search,
  status,
  type,
  modality,
}: OrdinaryLoansListProps) {
  const filters = {
    page,
    limit,
    ...(search && { search }),
    ...(status && { status }),
    ...(type && { type }),
    ...(modality && { modality }),
  };

  const { data, isLoading } = useQueryLoansManagement(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={9} rowCount={limit} />;
  }

  const resultData = data as { data: unknown[]; meta: Record<string, unknown> } | undefined;

  return (
    <DataTable
      columns={columns}
      data={(resultData?.data as unknown[]) || []}
      totalItems={(resultData?.meta?.totalCount as number) || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
