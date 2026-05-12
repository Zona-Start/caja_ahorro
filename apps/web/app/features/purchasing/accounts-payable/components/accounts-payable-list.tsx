import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useAccountsPayableFilters } from '../hooks/use-accounts-payable-filters';
import { useAccountsPayableQuery } from '../hooks/use-accounts-payable-queries';
import { accountsPayableColumns } from './accounts-payable-tables/columns';

export default function AccountsPayableList() {
  const { filters } = useAccountsPayableFilters();
  const { data, isLoading } = useAccountsPayableQuery(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={11} rowCount={filters.limit} />;
  }

  const accountsPayableData = data?.data || [];

  return (
    <DataTable
      columns={accountsPayableColumns}
      data={accountsPayableData}
      totalItems={data?.meta.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
}
