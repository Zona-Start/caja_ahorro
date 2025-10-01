'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { columns } from './tables/columns';
import { usePaginatedBankMovements } from '../hooks/use-query-bank-movement';

interface BankMovementListProps {
  initialPage: number;
  initialLimit: number;
  initialBankAccountId?: number | null;
  initialStartDate?: string | null;
  initialEndDate?: string | null;
}

export default function BankMovementList({
  initialPage,
  initialLimit,
  initialBankAccountId,
  initialStartDate,
  initialEndDate,
}: BankMovementListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialBankAccountId && { bankAccountId: initialBankAccountId }),
    ...(initialStartDate && { startDate: initialStartDate }),
    ...(initialEndDate && { endDate: initialEndDate }),
  };

  const { data, isLoading } = usePaginatedBankMovements(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={8} rowCount={initialLimit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data || []}
      totalItems={data?.total || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
