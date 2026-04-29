'use client';

import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { DataTable } from '@repo/shadcn/table/data-table';
import { useQueryLoanDisbursementBatches } from '../hooks/use-query-loan-disbursement-batch';
import { FilterLoanDisbursementBatch } from '../schemas/loan-disbursement/batch.schema';
import { columns } from './loan-disbursement/batch-tables/columns';

interface LoanDisbursementBatchListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialStatus?: string | null;
}

export default function LoanDisbursementBatchList({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
}: LoanDisbursementBatchListProps) {
  const filters: FilterLoanDisbursementBatch = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialStatus && { status: initialStatus as any }), // Cast as any for now, will refine enum usage
  };

  const { data, isLoading } = useQueryLoanDisbursementBatches(filters);

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
