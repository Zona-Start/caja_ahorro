'use client';

import { DataTable } from '@repo/shadcn/components/ui/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { useAccountPayableStore } from '../store/accounts-payable-store';
import { useSupplierPaymentStore } from '../store/supplier-payment-store';
import { columns } from './tables/columns';
import { pendingColumns } from './tables/pending-columns';
import { useSupplierPaymentsFilters } from './tables/use-supplier-payments-filters';

export default function SupplierPaymentList() {
  const { tab } = useSupplierPaymentsFilters();
  const isPendingTab = tab === 'pending';

  const {
    data: supplierPayments,
    meta: supplierPaymentsMeta,
    isLoading: supplierPaymentsLoading,
  } = useSupplierPaymentStore();
  const {
    data: accountsPayable,
    meta: accountsPayableMeta,
    isLoading: accountsPayableLoading,
  } = useAccountPayableStore();

  const isLoading = isPendingTab
    ? accountsPayableLoading
    : supplierPaymentsLoading;
  const data = isPendingTab ? accountsPayable : supplierPayments;
  const meta = isPendingTab ? accountsPayableMeta : supplierPaymentsMeta;
  const tableColumns = isPendingTab ? pendingColumns : columns;

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={meta.limit || 10} />;
  }

  return (
    <DataTable
      columns={tableColumns as any}
      data={data || []}
      totalItems={meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
