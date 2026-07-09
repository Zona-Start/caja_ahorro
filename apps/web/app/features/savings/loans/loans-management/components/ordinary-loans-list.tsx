'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useQueryLoansManagement } from '../hooks/use-loans-management-query';
import { createLoanColumns, type LoanTableRow } from './loans-tables/columns';

interface OrdinaryLoansListProps {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  type?: string;
  modality?: string;
  onViewDetails?: (data: LoanTableRow) => void;
}

export function OrdinaryLoansList({
  page,
  limit,
  search,
  status,
  type,
  modality,
  onViewDetails,
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
      columns={createLoanColumns(onViewDetails)}
      data={(resultData?.data as unknown[]) || []}
      totalItems={(resultData?.meta?.totalItems as number) || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
