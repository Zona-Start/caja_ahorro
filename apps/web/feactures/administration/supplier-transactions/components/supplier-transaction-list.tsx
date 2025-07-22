'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useSupplierTransactions } from '../hooks/use-query-supplier-transaction';
import { columns } from './supplier-transaction-tables/columns';

interface ListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialStatus?: string | null;
  initialAccountsPayableId?: number | null;
  initialTransactionType?: string | null;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
}

export default function SupplierTransactionList({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
  initialAccountsPayableId,
  initialTransactionType,
  initialStartDate,
  initialEndDate,
}: ListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialStatus && { status: initialStatus }),
    ...(initialAccountsPayableId && { accountsPayableId: initialAccountsPayableId }),
    ...(initialTransactionType && { transactionType: initialTransactionType }),
    ...(initialStartDate && { startDate: initialStartDate }),
    ...(initialEndDate && { endDate: initialEndDate }),
  };

  const { data, isLoading } = useSupplierTransactions(filters);

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
