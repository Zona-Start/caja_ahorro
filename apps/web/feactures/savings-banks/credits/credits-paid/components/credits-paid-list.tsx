'use client';

import { DataTable } from '@repo/shadcn/table/data-table';

import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { useQueryCreditPaid } from '../hooks/use-query-credits-paid';
import { columns } from './credits-paid-tables/columns';

interface CreditPaidtListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialBank?: string | null;
  initialType?: string | null;
  inititalMethod?: string | null;
}

export default function CreditsPaidList({
  initialPage,
  initialSearch,
  initialLimit,
  initialBank,
  initialType,
  inititalMethod,
}: CreditPaidtListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialBank && { bank: initialBank }),
    ...(initialType && { type: initialType }),
    ...(inititalMethod && { method: inititalMethod }),
  };

  const { data, isLoading } = useQueryCreditPaid(filters);

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
