'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useTypePayrollPaginated } from '../hooks/use-query-type-payroll';
import { columns } from './type-payroll-tables/columns';

interface TypePayrollListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialGroup?: string | null;
}

export default function TypePayrollList({
  initialPage,
  initialSearch,
  initialLimit,
  initialGroup,
}: TypePayrollListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialGroup && { group: initialGroup }),
  };

  const { data, isLoading } = useTypePayrollPaginated(filters);

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
