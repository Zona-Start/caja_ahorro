import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useBankAccountFilters } from '../hooks/use-bank-account-filters';
import { useBankAccountsQuery } from '../hooks/use-bank-account-query';
import { bankAccountColumns } from './bank-account-tables/columns';

export default function BankAccountList() {
  const { filters } = useBankAccountFilters();
  const { data, isLoading } = useBankAccountsQuery(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={filters.limit} />;
  }

  const bankAccountsData = data?.data || [];

  return (
    <DataTable
      columns={bankAccountColumns}
      data={bankAccountsData}
      totalItems={data?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
}
