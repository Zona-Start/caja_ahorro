import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { usePaginatedAccountingBalances } from '../hooks/use-accounting-balances-query';
import { useAccountingBalancesFilters } from '../hooks/use-accounting-balances-filters';
import { columns } from './tables/columns';

export default function AccountingBalancesList() {
  const { filters } = useAccountingBalancesFilters();
  const { data, isLoading } = usePaginatedAccountingBalances(filters);

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
