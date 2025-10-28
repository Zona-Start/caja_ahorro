'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { columns } from './tables/columns';
import { usePaginatedAccountingConfigurations } from '../hooks/use-query-accounting-configuration';

interface AccountingConfigurationsListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
}

export default function AccountingConfigurationsList({
  initialPage,
  initialSearch,
  initialLimit,
}: AccountingConfigurationsListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
  };

  const { data, isLoading } = usePaginatedAccountingConfigurations(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={4} rowCount={initialLimit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data || []}
      totalItems={data?.meta.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
