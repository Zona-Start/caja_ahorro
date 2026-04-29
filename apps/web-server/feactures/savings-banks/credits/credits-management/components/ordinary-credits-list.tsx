'use client';

import { DataTable } from '@repo/shadcn/table/data-table';

import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { useQueryCreditManagement } from '../hooks/use-query-credits-management';
import { columns } from './credits-tables/columns';

interface CreditManagementListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialStatus?: string | null;
  initialType?: string | null;
  inititalModality?: string | null;
}

export default function CreditsList({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
  initialType,
  inititalModality,
}: CreditManagementListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialStatus && { status: initialStatus }),
    ...(initialType && { type: initialType }),
    ...(inititalModality && { modality: inititalModality }),
  };

  const { data, isLoading } = useQueryCreditManagement(filters);

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
