import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { usePaginatedAccountingCycles } from '../hooks/use-accounting-cycles-query';
import { useAccountingCyclesFilters } from '../hooks/use-accounting-cycles-filters';
import { columns } from './tables/columns';

export default function AccountingCycleList() {
  const { filters } = useAccountingCyclesFilters();
  const { data, isLoading } = usePaginatedAccountingCycles(filters);

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
