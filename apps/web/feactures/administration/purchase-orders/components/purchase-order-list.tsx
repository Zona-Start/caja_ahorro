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
  initialSupplierId?: number | null;
  initialOrderType?: string | null;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
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
      data={data?.data || []}
      totalItems={data?.meta.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
