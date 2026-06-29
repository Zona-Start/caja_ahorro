'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { createColumns, type CreditTableRow } from './credits-tables/columns';
import { useQueryCreditsManagement } from '../hooks/use-credits-management-query';

interface OrdinaryCreditsListProps {
  page: number;
  search: string;
  limit: number;
  status: string;
  type: string;
  modality: string;
  onViewDetails?: (data: CreditTableRow) => void;
}

export function OrdinaryCreditsList({
  page,
  search,
  limit,
  status,
  type,
  modality,
  onViewDetails,
}: OrdinaryCreditsListProps) {
  const filters = {
    page,
    limit,
    ...(search && { search }),
    ...(status && { status }),
    ...(type && { type }),
    ...(modality && { modality }),
  };

  const { data, isLoading } = useQueryCreditsManagement(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={10} rowCount={limit} />;
  }

  return (
    <DataTable
      columns={createColumns(onViewDetails)}
      data={data?.data || []}
      totalItems={data?.meta?.totalItems || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
