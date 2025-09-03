'use client';
import { DataTable } from '@repo/shadcn/components/ui/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { useSupplierPayments } from '../hooks';
import { columns } from './tables/columns';

interface ListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialStatus?: string | null;
  initialSupplierId?: number | null;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
}

export default function SupplierPaymentList({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
  initialSupplierId,
  initialStartDate,
  initialEndDate,
}: ListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialStatus && { status: initialStatus }),
    ...(initialSupplierId && { supplierId: initialSupplierId }),
    ...(initialStartDate && { startDate: initialStartDate }),
    ...(initialEndDate && { endDate: initialEndDate }),
  };

  const { data, isLoading } = useSupplierPayments(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={initialLimit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data || []}
      totalItems={data?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
