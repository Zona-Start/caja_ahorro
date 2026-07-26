import { useState } from 'react';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useSupplierInvoicesFilters } from '../hooks/use-supplier-invoices-filters';
import { useSupplierInvoicesQuery } from '../hooks/use-supplier-invoices-queries';
import { useSupplierInvoicesModalStore } from '../store/supplier-invoices-modal.store';
import { supplierInvoicesColumns } from './supplier-invoices-table/supplier-invoices-columns';
import { SupplierInvoicesTableAction } from './supplier-invoices-table/supplier-invoices-table-action';
import { SupplierInvoicesHeader } from './supplier-invoices-header';
import { SupplierInvoicesModal } from './supplier-invoices-modal';
import { CreditDebitNoteModal } from './credit-debit-note-modal';

export default function SupplierInvoicesList() {
  const { filters, setFilters, clearFilters } = useSupplierInvoicesFilters();
  const { data, isLoading } = useSupplierInvoicesQuery(filters);
  const { openModal } = useSupplierInvoicesModalStore();
  const [showCreditDebitModal, setShowCreditDebitModal] = useState(false);

  if (isLoading) {
    return <DataTableSkeleton columnCount={8} rowCount={filters.limit} />;
  }

  const invoicesData = data?.data || [];

  const totalItems =
    (data?.meta && 'totalCount' in data.meta
      ? data.meta.totalCount
      : (data?.meta && 'totalItems' in data.meta
        ? data.meta.totalItems
        : 0));

  return (
    <div className="space-y-4">
      <SupplierInvoicesHeader
        onCreditDebitClick={() => setShowCreditDebitModal(true)}
      />

      <SupplierInvoicesTableAction
        filters={filters}
        setFilters={setFilters}
        clearFilters={clearFilters}
      />

      <DataTable
        columns={supplierInvoicesColumns}
        data={invoicesData}
        totalItems={totalItems}
        pageSizeOptions={[10, 20, 30, 50]}
      />

      <SupplierInvoicesModal />

      <CreditDebitNoteModal
        open={showCreditDebitModal}
        onOpenChange={setShowCreditDebitModal}
      />
    </div>
  );
}
