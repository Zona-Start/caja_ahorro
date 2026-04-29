'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useSettingsSystemGet } from '../hooks/use-query-system-properties';
import { columns } from './system-properties-tables/columns';

interface SettingSystemListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialType?: string | null;
  initialGroup?: string;
}

export default function SettingSystemList({
  initialPage,
  initialSearch,
  initialLimit,
  initialType,
  initialGroup,
}: SettingSystemListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialType && { type: initialType }),
    ...(initialGroup && { group: initialGroup }),
  };

  const { data, isLoading } = useSettingsSystemGet(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={initialLimit} />;
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
