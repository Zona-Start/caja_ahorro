'use client';

import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { SupplierTransactionModal } from '../supplier-transaction-modal';
import {
  SUPPLIER_TRANSACTION_STATUS_OPTIONS,
  SUPPLIER_TRANSACTION_TYPE_OPTIONS,
  useSupplierTransactionsFilters,
} from './use-supplier-transactions-filters';

export default function SupplierTransactionTableAction() {
  const {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    setPage,
    setTransactionTypeFilter,
    transactionTypeFilter,
  } = useSupplierTransactionsFilters();

  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por referencia"
          searchKey={searchQuery}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="transactionType"
          title="Tipo de Transacción"
          options={SUPPLIER_TRANSACTION_TYPE_OPTIONS}
          setFilterValue={setTransactionTypeFilter}
          filterValue={transactionTypeFilter}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estatus"
          options={SUPPLIER_TRANSACTION_STATUS_OPTIONS}
          setFilterValue={setStatusFilter}
          filterValue={statusFilter}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Nueva Transacción
      </Button>

      <SupplierTransactionModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
