'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useFixedAssetCategoriesSchemaAPI } from '../hooks/use-query-fixed-asset-categories';
import { columns } from './fixed-asset-categories-tables/columns';

interface FixedAssetCategoriesListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
}

export default function FixedAssetCategoriesList({
  initialPage,
  initialSearch,
  initialLimit,
}: FixedAssetCategoriesListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
  };

  const { data, isLoading } = useFixedAssetCategoriesSchemaAPI(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={3} rowCount={initialLimit} />;
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
