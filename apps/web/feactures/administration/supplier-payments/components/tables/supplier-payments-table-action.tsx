'use client';
import { Button } from '@repo/shadcn/components/ui/button';
import { DataTableFilterBox } from '@repo/shadcn/components/ui/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/components/ui/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { SupplierPaymentModal } from '../supplier-payment-modal';
import {
  SUPPLIER_PAYMENT_STATUS_OPTIONS,
  useSupplierPaymentsFilters,
} from './use-supplier-payments-filters';

export default function SupplierPaymentsTableActions() {
  const {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setPage,
    setSearchQuery,
  } = useSupplierPaymentsFilters();

  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por referencia..."
          searchKey={searchQuery}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estatus"
          options={SUPPLIER_PAYMENT_STATUS_OPTIONS}
          setFilterValue={setStatusFilter}
          filterValue={statusFilter}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4" /> Nuevo Pago
      </Button>

      <SupplierPaymentModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
