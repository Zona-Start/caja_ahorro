'use client';

import { DataTable } from '@repo/shadcn/components/ui/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { useMemo } from 'react';
import { useAccountPayableStore } from '../store/accounts-payable-store';
import { useSupplierPaymentStore } from '../store/supplier-payment-store';
import { SupplierPaymentRow } from '../types/table';
import { toPaymentRow, toPendingRow } from '../utils/mappers';
import { columns } from './tables/columns';
import { pendingColumns } from './tables/pending-columns';
import { useSupplierPaymentsFilters } from './tables/use-supplier-payments-filters';

export default function SupplierPaymentList() {
  const { tab } = useSupplierPaymentsFilters();
  const isPendingTab = tab === 'pending';

  const {
    data: payments,
    meta: paymentsMeta,
    isLoading,
  } = useSupplierPaymentStore();
  const {
    data: payables,
    meta: payablesMeta,
    isLoading: isLoadingPayables,
  } = useAccountPayableStore();

  // 1. Unificamos ambas fuentes al mismo tipo
  const rows = useMemo<SupplierPaymentRow[]>(() => {
    if (isPendingTab) {
      return (payables ?? []).map(toPendingRow);
    }
    return (payments ?? []).map(toPaymentRow);
  }, [isPendingTab, payments, payables]);

  // 2. Elegimos columnas
  const tableColumns = isPendingTab ? pendingColumns : columns;
  const meta = isPendingTab ? payablesMeta : paymentsMeta;

  if (isLoading || isLoadingPayables) {
    return <DataTableSkeleton columnCount={6} rowCount={meta.limit || 10} />;
  }

  return (
    <DataTable
      columns={tableColumns}
      data={rows} // <-- siempre SupplierPaymentRow[]
      totalItems={meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
