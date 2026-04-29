'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useFixedAsset } from '../hooks/use-query-fixed-asset';
import { columns } from './fixed-asset-tables/columns';

interface SalesProductListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialTypeCategory?: string | null;
  initialStatus?: string | null;
}

export default function FixedAssetList({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
  initialTypeCategory,
}: SalesProductListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialTypeCategory && { typeCategory: initialTypeCategory }),
    ...(initialStatus && { status: initialStatus }),
  };

  const { data, isLoading } = useFixedAsset(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={initialLimit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      totalItems={data?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
