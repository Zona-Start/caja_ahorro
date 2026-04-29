'use client';

import { Button } from '@repo/shadcn/components/ui/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useAccountingCycles } from '../../../accounting-cycles/hooks/use-query-accounting-cycle';
import { AccountingEntryModal } from '../accounting-entry-modal';
import {
  STATUS_OPTIONS,
  useAccountingEntryTableFilters,
} from './use-accounting-entry-table-filters';

export default function AccountingEntryTableAction() {
  const [open, setOpen] = useState(false);
  const {
    statusFilter,
    setStatusFilter,
    cycleFilter,
    setCycleFilter,
    searchQuery,
    setPage,
    setSearchQuery,
  } = useAccountingEntryTableFilters();

  const { data: cycles } = useAccountingCycles();

  const cycleOptions =
    cycles?.data?.map((cycle) => ({
      value: cycle.id!.toString(),
      label: cycle.description as string,
    })) || [];

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por descripción..."
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
        <DataTableFilterBox
          filterKey="accountingCycleId"
          title="Ciclo Contable"
          options={cycleOptions}
          setFilterValue={(value) =>
            setCycleFilter(value ? Number(value) : null)
          }
          filterValue={cycleFilter?.toString() ?? ''}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Crear Asiento
      </Button>

      <AccountingEntryModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
