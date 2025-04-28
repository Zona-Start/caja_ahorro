'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useBankAccount } from '../hooks/use-query-bank-account';
import { columns } from './bank-account-tables/columns';

interface AssociatesListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialStatus?: string | null;
}

export default function BankAccountList({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
}: AssociatesListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialStatus && { status: initialStatus }),
  };

  const { data, isLoading } = useBankAccount(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={initialLimit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={(data?.data || []).map((item) => ({
        ...item,
        currencyCode: item.currencyCode as 'VES' | 'USD' | 'EUR',
        lastStatementDate: item.lastStatementDate
          ? new Date(item.lastStatementDate)
          : undefined,
        openingDate: item.openingDate ? new Date(item.openingDate) : undefined,
        currentBalance: item.currentBalance
          ? parseFloat(item.currentBalance)
          : undefined,
        lastStatementBalance: item.lastStatementBalance
          ? parseFloat(item.lastStatementBalance)
          : undefined,
      }))}
      totalItems={data?.meta.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
