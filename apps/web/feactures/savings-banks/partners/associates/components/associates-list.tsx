'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useAssociates } from '../hooks/use-query-associates';
import { columns } from './associates-tables/columns';

interface AssociatesListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialStatus?: string | null;
  initialPayroll?: string | null;
}

export default function AssociatesList({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
  initialPayroll,
}: AssociatesListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialStatus && { status: initialStatus }),
    ...(initialPayroll && { payroll: initialPayroll }),
  };

  const { data, isLoading } = useAssociates(filters);

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
