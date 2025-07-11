'use client';

import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { InvoicePayableModal } from '../invoices-payable-modal';
import {
  ESTATUS_OPTIONS,
  useInvoicesPayableFilters,
} from './use-invoices-payable-filters';

export default function InvoicePayableTableAction() {
  const {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setPage,
    setSearchQuery,
  } = useInvoicesPayableFilters();

  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por número de factura"
          searchKey={searchQuery}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estatus"
          options={ESTATUS_OPTIONS}
          setFilterValue={setStatusFilter}
          filterValue={statusFilter}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4" /> Nueva Factura
      </Button>

      <InvoicePayableModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
