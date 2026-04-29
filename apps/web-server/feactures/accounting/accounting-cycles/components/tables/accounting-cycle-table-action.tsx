'use client';

import { Button } from '@repo/shadcn/components/ui/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { AccountingCycleModal } from '../accounting-cycle-modal';
import {
  STATUS_OPTIONS,
  useAccountingCycleTableFilters,
} from './use-accounting-cycle-table-filters';

export default function AccountingCycleTableAction() {
  const [open, setOpen] = useState(false);
  const {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setPage,
    setSearchQuery,
  } = useAccountingCycleTableFilters();

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por descripción"
          searchKey="description"
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estado"
          options={STATUS_OPTIONS}
          setFilterValue={setStatusFilter}
          filterValue={statusFilter}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Ciclo
      </Button>

      <AccountingCycleModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
