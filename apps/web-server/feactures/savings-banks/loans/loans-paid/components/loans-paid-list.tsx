'use client';

import { DataTable } from '@repo/shadcn/table/data-table';

import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { useQueryLoanPaid } from '../hooks/use-query-loans-paid';
import { columns } from './loans-paid-tables/columns';

interface LoanPaidtListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialBank?: string | null;
  initialType?: string | null;
  inititalMethod?: string | null;
}

export default function LoansPaidList({
  initialPage,
  initialSearch,
  initialLimit,
  initialBank,
  initialType,
  inititalMethod,
}: LoanPaidtListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialBank && { bank: initialBank }),
    ...(initialType && { type: initialType }),
    ...(inititalMethod && { method: inititalMethod }),
  };

  const { data, isLoading } = useQueryLoanPaid(filters);

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
