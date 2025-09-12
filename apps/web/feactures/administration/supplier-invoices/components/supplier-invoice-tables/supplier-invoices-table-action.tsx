'use client';

import { useSupplierAll } from '@/feactures/administration/suppliers/hooks/use-query-suppliers';
import { Button } from '@repo/shadcn/button';
import { SelectSearchable } from '@repo/shadcn/components/ui/select-searchable';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { SupplierInvoiceModal } from '../supplier-invoice-modal';
import {
  SUPPLIER_INVOICE_STATUS_OPTIONS,
  useSupplierInvoicesFilters,
} from './use-supplier-invoices-filters';

export default function SupplierInvoiceTableAction() {
  const {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setPage,
    setSearchQuery,
    supplierIdFilter,
    setSupplierIdFilter,
  } = useSupplierInvoicesFilters();

  const [open, setOpen] = useState(false);
  const { data: suppliers } = useSupplierAll();

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por referencia de factura"
          searchKey={searchQuery}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <div className="w-[200px] p-0">
          <SelectSearchable
            placeholder="Filtrar por proveedor"
            options={
              suppliers?.map((supplier) => ({
                value: supplier.id!.toString(),
                label: supplier.name,
              })) || []
            }
            onValueChange={(value) => {
              setSupplierIdFilter(value ? Number(value) : null);
            }}
            defaultValue={supplierIdFilter?.toString()}
            enableNoneOption
          />
        </div>
        <DataTableFilterBox
          filterKey="status"
          title="Estatus"
          options={SUPPLIER_INVOICE_STATUS_OPTIONS}
          setFilterValue={setStatusFilter}
          filterValue={statusFilter}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4" /> Anexar Factura
      </Button>

      <SupplierInvoiceModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
