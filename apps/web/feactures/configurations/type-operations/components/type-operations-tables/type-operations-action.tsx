'use client';

import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { TypeOperationsModal } from '../type-operations-modal';
import {
  GROUPS_TYPES,
  useTypeOperationsFilters,
} from './use-type-operations-filters';

export default function TypeOperationsTableAction() {
  const { searchQuery, setPage, setSearchQuery, setGroupFilter, groupFilter } =
    useTypeOperationsFilters();

  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por descripción"
          searchKey={searchQuery}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="group"
          title="Grupo"
          options={GROUPS_TYPES}
          setFilterValue={setGroupFilter}
          filterValue={groupFilter}
        />
      </div>

      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4" /> Agregar Tipo
      </Button>

      <TypeOperationsModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
