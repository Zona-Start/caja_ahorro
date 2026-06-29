import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { usePurchaseOrdersFilters } from '../hooks/use-purchase-orders-filters';
import { usePurchaseOrdersQuery } from '../hooks/use-purchase-orders-queries';
import { columns } from './purchase-orders-tables/columns';

export function PurchaseOrdersList() {
  const { filters } = usePurchaseOrdersFilters();
  const { data, isLoading } = usePurchaseOrdersQuery(filters);

  if (isLoading) return <DataTableSkeleton columnCount={7} rowCount={filters.limit} />;

  const listData = data?.data ?? [];
  const totalItems = data?.meta?.totalCount ?? 0;

  return (
    <DataTable
      columns={columns}
      data={listData}
      totalItems={totalItems}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
}
