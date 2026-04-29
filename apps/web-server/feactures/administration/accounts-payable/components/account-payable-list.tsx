'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useAccountsPayable } from '../hooks/use-query-account-payable';
import { columns } from './account-payable-tables/columns';

interface ListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialStatus?: string | null;
  initialSupplierInvoiceId?: number | null;
  initialSupplierId?: number | null;
}

export default function AccountPayableList({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
  initialSupplierInvoiceId,
  initialSupplierId,
}: ListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialStatus && { status: initialStatus }),
    ...(initialSupplierInvoiceId && {
      supplierInvoiceId: initialSupplierInvoiceId,
    }),
    ...(initialSupplierId && { supplierId: initialSupplierId }),
  };

  const { data, isLoading } = useAccountsPayable(filters);

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
