'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useGetBankMovements } from '../hooks/use-get-bank-movements';
import { columns } from './tables/columns';

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

  const { data, isLoading } = useGetBankMovements(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={8} rowCount={initialLimit} />;
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
