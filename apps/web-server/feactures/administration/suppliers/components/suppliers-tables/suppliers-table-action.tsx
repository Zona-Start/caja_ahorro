'use client';

import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { SupplierModal } from '../suppliers-modal';
import {
  ESTATUS_OPTIONS,
  SUPPLIER_CATEGORY_OPTIONS,
  useSupplierFilters,
} from './use-suppliers-filters';

export default function SupplierTableAction() {
  const {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setPage,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
  } = useSupplierFilters();

  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por nombre"
          searchKey={searchQuery}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="category"
          title="Categoría"
          options={SUPPLIER_CATEGORY_OPTIONS}
          setFilterValue={setCategoryFilter}
          filterValue={categoryFilter}
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
        <Plus className="h-4 w-4" /> Nuevo Proveedor
      </Button>

      <SupplierModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
