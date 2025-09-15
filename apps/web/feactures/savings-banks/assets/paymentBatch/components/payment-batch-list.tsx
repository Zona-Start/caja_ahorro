'use client';

import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { DataTable } from '@repo/shadcn/table/data-table';
import { useQueryPaymentBatches } from '../hooks/use-query-payment-batch';
import { FilterPaymentBatch } from '../schemas/payment-batch.schema';
import { columns } from './payment-batch-tables/columns';

interface PaymentBatchListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialStatus?: string | null;
}

export default function PaymentBatchList({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
}: PaymentBatchListProps) {
  const filters: FilterPaymentBatch = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialStatus && { status: initialStatus as any }), // Cast as any for now, will refine enum usage
  };

  const { data, isLoading } = useQueryPaymentBatches(filters);

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
