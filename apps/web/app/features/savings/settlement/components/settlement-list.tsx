import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useSettlementsQuery } from '../hooks/use-settlement-query';
import { useSettlementFilters } from '../hooks/use-settlement-filters';
import { columns } from './settlement-tables/columns';

export function SettlementList() {
  const { filters } = useSettlementFilters();
  const { data, isLoading } = useSettlementsQuery(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={9} rowCount={filters.limit} />;
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
