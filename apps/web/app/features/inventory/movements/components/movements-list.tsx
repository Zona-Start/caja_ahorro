import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useMovementsFilters } from '../hooks/use-movements-filters';
import { useMovementsQuery } from '../hooks/use-movements-queries';
import { movementsColumns } from './movements-tables/columns';

export default function MovementsList() {
  const { filters } = useMovementsFilters();
  const { data, isLoading } = useMovementsQuery(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={filters.limit} />;
  }

  return (
    <DataTable
      columns={movementsColumns}
      data={data?.data || []}
      totalItems={data?.meta.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
}
