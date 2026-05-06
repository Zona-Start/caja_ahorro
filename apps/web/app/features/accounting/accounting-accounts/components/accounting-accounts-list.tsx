import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useAccountingAccountsFilters } from '../hooks/use-accounting-accounts-filters';
import { usePaginatedAccountingAccounts } from '../hooks/use-accounting-accounts-query';
import { columns } from './accounts-tables/columns';

export default function AccountingAccountsList() {
  const { filters } = useAccountingAccountsFilters();
  const { data, isLoading } = usePaginatedAccountingAccounts(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={filters.limit} />;
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
