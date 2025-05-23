'use client';

import { DataTable } from '@repo/shadcn/table/data-table';

import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { useQueryLoanManagement } from '../hooks/use-query-loans-management';
import { columns } from './loans-tables/columns';

interface LoanManagementListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialStatus?: string | null;
  initialType?: string | null;
  inititalModality?: string | null;
}

export default function LoansList({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
  initialType,
  inititalModality,
}: LoanManagementListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialStatus && { status: initialStatus }),
    ...(initialType && { type: initialType }),
    ...(inititalModality && { mdoality: inititalModality }),
  };

  const { data, isLoading } = useQueryLoanManagement(filters);

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
