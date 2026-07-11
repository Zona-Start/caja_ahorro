import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useQueryPaymentBatches } from '../hooks/use-payment-batch-query';
import { paymentBatchColumns } from './payment-batch-tables/columns';
import { type PaymentBatch } from '../services/payment-batch-service';

interface PaymentBatchListProps {
  page: number;
  search?: string | null;
  limit: number;
  status?: string | null;
}

export function PaymentBatchList({
  page,
  search,
  limit,
  status,
}: PaymentBatchListProps) {
  const params = {
    page,
    limit,
    ...(search && { search }),
    ...(status && { status }),
  };

  const { data, isLoading } = useQueryPaymentBatches(params);

  if (isLoading) {
    return <DataTableSkeleton columnCount={8} rowCount={limit} />;
  }

  return (
    <DataTable
      columns={paymentBatchColumns}
      data={(data?.data as PaymentBatch[]) || []}
      totalItems={(data?.meta as any)?.totalItems || 0}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
}
