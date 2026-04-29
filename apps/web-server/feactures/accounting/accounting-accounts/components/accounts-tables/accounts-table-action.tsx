'use client';

import { Button } from '@repo/shadcn/components/ui/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { AccountPlanModal } from '../account-plan-modal';
import {
  LEVEL_OPTIONS,
  TYPE_OPTIONS,
  useAccountsTableFilters,
} from './use-accounts-table-filters';

export default function AccountsTableAction() {
  const [open, setOpen] = useState(false);
  const {
    typeFilter,
    setTypeFilter,
    levelFilter,
    setLevelFilter,
    searchQuery,
    setPage,
    setSearchQuery,
  } = useAccountsTableFilters();

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por código o nombre"
          searchKey={String(/^\d/.test(searchQuery))}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="type"
          title="Tipo de Cuenta"
          options={TYPE_OPTIONS}
          setFilterValue={setTypeFilter}
          filterValue={typeFilter}
        />
        <DataTableFilterBox
          filterKey="level"
          title="Nivel"
          options={LEVEL_OPTIONS}
          setFilterValue={setLevelFilter}
          filterValue={levelFilter}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Cuenta
      </Button>

      <AccountPlanModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
