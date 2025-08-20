'use client';

import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { DataTable } from '@repo/shadcn/table/data-table';
import { usePurchaseOrders } from '../hooks/use-query-purchase-order';
import { columns } from './purchase-order-tables/columns';

interface ListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialStatus?: string | null;
  initialSupplierId?: number | null;
  initialOrderType?: string | null;
  initialStartDate?: string | null;
  initialEndDate?: string | null;
}

export default function PurchaseOrderList({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
  initialSupplierId,
  initialOrderType,
  initialStartDate,
  initialEndDate,
}: ListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialStatus && { status: initialStatus }),
    ...(initialSupplierId && { supplierId: initialSupplierId }),
    ...(initialOrderType && { orderType: initialOrderType }),
    ...(initialStartDate && { startDate: initialStartDate }),
    ...(initialEndDate && { endDate: initialEndDate }),
  };

  const { data, isLoading } = usePurchaseOrders(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={initialLimit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={Array.isArray(data?.data) ? data.data : []}
      totalItems={data?.meta.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
