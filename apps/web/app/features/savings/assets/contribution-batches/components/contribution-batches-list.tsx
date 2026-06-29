'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useQueryContributionBatches } from '../hooks/use-contribution-batches-query';
import { columns } from './contribution-batches-table/columns';
import type { ContributionBatchesFilters } from '../hooks/use-contribution-batches-filters';

interface ContributionBatchesListProps {
  filters: ContributionBatchesFilters;
}

export function ContributionBatchesList({
  filters,
}: ContributionBatchesListProps) {
  const { data, isLoading } = useQueryContributionBatches(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={filters.limit || 10} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      totalItems={data?.meta?.totalCount ?? 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
