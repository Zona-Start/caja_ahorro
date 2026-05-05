import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { usePaginatedAccountingEntries } from '../hooks/use-accounting-entries-query';
import { useAccountingEntriesFilters } from '../hooks/use-accounting-entries-filters';
import { columns } from './tables/columns';

export default function AccountingEntryList() {
  const { filters } = useAccountingEntriesFilters();
  const { data, isLoading } = usePaginatedAccountingEntries(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={filters.limit} />;
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
