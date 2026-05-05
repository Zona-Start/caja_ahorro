import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { AccountPlanModal } from '../account-plan-modal';
import { useAccountingAccountsFilters } from '../../hooks/use-accounting-accounts-filters';
import {
  ACCOUNT_LEVELS,
  ACCOUNT_TYPES,
} from '../../schemas/account-plan-options';

export const TYPE_OPTIONS = Object.entries(ACCOUNT_TYPES).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export const LEVEL_OPTIONS = Object.entries(ACCOUNT_LEVELS).map(
  ([value, label]) => ({
    value: value.toString(),
    label,
  }),
);

export default function AccountsTableAction() {
  const [open, setOpen] = useState(false);
  const { filters, setFilters } = useAccountingAccountsFilters();

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por código o nombre"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={(v) => setFilters({ search: v, page: 1 })}
          setPage={(p) => setFilters({ page: p })}
        />
        <DataTableFilterBox
          filterKey="type"
          title="Tipo de Cuenta"
          options={TYPE_OPTIONS}
          setFilterValue={(v) => setFilters({ type: v, page: 1 })}
          filterValue={filters.type || ''}
        />
        <DataTableFilterBox
          filterKey="level"
          title="Nivel"
          options={LEVEL_OPTIONS}
          setFilterValue={(v) => setFilters({ level: v, page: 1 })}
          filterValue={filters.level || ''}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Cuenta
      </Button>

      <AccountPlanModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
