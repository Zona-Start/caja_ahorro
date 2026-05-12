import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useBankMovementsFilters } from '../hooks/use-bank-movements-filters';
import { useBankMovementsQuery } from '../hooks/use-bank-movements-query';
import { bankMovementsColumns } from './bank-movement-tables/columns';

export default function BankMovementList() {
  const { filters } = useBankMovementsFilters();
  const { data, isLoading } = useBankMovementsQuery(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={9} rowCount={filters.limit} />;
  }

  const movementsData = data?.data || [];

  return (
    <DataTable
      columns={bankMovementsColumns}
      data={movementsData}
      totalItems={data?.meta.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
}
