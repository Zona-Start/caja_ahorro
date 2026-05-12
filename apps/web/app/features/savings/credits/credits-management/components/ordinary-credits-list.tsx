'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { columns } from './credits-tables/columns';
import { useQueryCreditsManagement } from '../hooks/use-credits-management-query';

interface OrdinaryCreditsListProps {
  page: number;
  search?: string | null;
  limit: number;
  status?: string | null;
  type?: string | null;
  modality?: string | null;
}

export function OrdinaryCreditsList({
  page,
  search,
  limit,
  status,
  type,
  modality,
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
      columns={columns}
      data={data?.data || []}
      totalItems={data?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
