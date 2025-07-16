'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { usePurchaseOrders } from '../hooks/use-query-purchase-order';
import { columns } from './purchase-order-tables/columns';

interface ListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialStatus?: string | null;
}

export default function PurchaseOrderList({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
}: ListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialStatus && { status: initialStatus }),
  };

  const { data, isLoading } = usePurchaseOrders(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={initialLimit} />;
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