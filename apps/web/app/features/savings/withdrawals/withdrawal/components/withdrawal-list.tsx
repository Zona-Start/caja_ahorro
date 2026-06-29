import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useWithdrawalsQuery } from '../hooks/use-withdrawal-query';
import { useWithdrawalFilters } from '../hooks/use-withdrawal-filters';
import { columns } from './withdrawal-tables/columns';

export function WithdrawalList() {
  const { filters } = useWithdrawalFilters();
  const { data, isLoading } = useWithdrawalsQuery(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={filters.limit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data || []}
      totalItems={data?.meta?.totalItems || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
