import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useInventoryServicesPaginatedQuery } from '../hooks/use-inventory-services-queries';
import { useInventoryServicesFilters } from '../hooks/use-inventory-services-filters';
import { inventoryServicesColumns } from './inventory-services-tables/columns';

export default function InventoryServicesList() {
  const { filters } = useInventoryServicesFilters();
  const { data, isLoading } = useInventoryServicesPaginatedQuery(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={filters.limit} />;
  }

  return (
    <DataTable
      columns={inventoryServicesColumns}
      data={data?.data || []}
      totalItems={data?.meta.totalItems || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
