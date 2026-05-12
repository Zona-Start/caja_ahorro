import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useSupplierPaymentsFilters } from '../hooks/use-supplier-payments-filters';
import { useSupplierPaymentsQuery } from '../hooks/use-supplier-payments-queries';
import { useSupplierPaymentsModalStore } from '../store/supplier-payments-modal.store';
import { supplierPaymentsColumns } from './supplier-payments-table/supplier-payments-columns';
import { SupplierPaymentsTableAction } from './supplier-payments-table/supplier-payments-table-action';
import { SupplierPaymentsHeader } from './supplier-payments-header';
import { SupplierPaymentsModal } from './supplier-payments-modal';

export default function SupplierPaymentsList() {
  const { filters, setFilters, clearFilters } = useSupplierPaymentsFilters();
  const { data, isLoading } = useSupplierPaymentsQuery(filters);
  const { openModal } = useSupplierPaymentsModalStore();

  if (isLoading) {
    return <DataTableSkeleton columnCount={9} rowCount={filters.limit} />;
  }

  const paymentsData = data?.data || [];

  const totalItems =
    (data?.meta && 'totalCount' in data.meta
      ? data.meta.totalCount
      : (data?.meta && 'totalItems' in data.meta
        ? data.meta.totalItems
        : 0));

  return (
    <div className="space-y-4">
      <SupplierPaymentsHeader />

      <SupplierPaymentsTableAction
        filters={filters}
        setFilters={setFilters}
        clearFilters={clearFilters}
        onPayClick={() => openModal('pay')}
        onAdvanceClick={() => openModal('payAdvance')}
      />

      <DataTable
        columns={supplierPaymentsColumns}
        data={paymentsData}
        totalItems={totalItems}
        pageSizeOptions={[10, 20, 30, 50]}
      />

      <SupplierPaymentsModal />
    </div>
  );
}
