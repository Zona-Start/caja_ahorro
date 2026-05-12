import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import {
  useInventoryFixedAssetsPaginatedQuery,
} from '../hooks/use-inventory-fixed-assets-queries';
import { useInventoryFixedAssetsFilters } from '../hooks/use-inventory-fixed-assets-filters';
import { inventoryFixedAssetsColumns } from './inventory-fixed-assets-tables/columns';

export default function InventoryFixedAssetsList() {
  const { filters } = useInventoryFixedAssetsFilters();
  const { data, isLoading } = useInventoryFixedAssetsPaginatedQuery(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={10} rowCount={filters.limit} />;
  }

  return (
    <DataTable
      columns={inventoryFixedAssetsColumns}
      data={data?.data || []}
      totalItems={data?.meta.totalItems || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
