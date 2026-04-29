'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { columns } from './accounts-tables/columns';
import { usePaginatedAccounts } from '../hooks/use-query-account-plan';

interface AccountingAccountsListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialType?: string | null;
  initialLevel?: string | null;
}

export default function AccountingAccountsList({
  initialPage,
  initialSearch,
  initialLimit,
  initialType,
  initialLevel,
}: AccountingAccountsListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialType && { type: initialType }),
    ...(initialLevel && { level: Number(initialLevel) }),
  };

  const { data, isLoading } = usePaginatedAccounts(filters);

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
