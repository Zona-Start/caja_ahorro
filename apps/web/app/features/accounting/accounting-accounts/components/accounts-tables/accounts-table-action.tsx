import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { Input } from '@repo/shadcn/input';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AccountPlanModal } from '../account-plan-modal';
import { useAccountingAccountsFilters } from '../../hooks/use-accounting-accounts-filters';
import {
  ACCOUNT_LEVELS,
  ACCOUNT_TYPES,
} from '../../schemas/account-plan-options';
import { useAuthStore } from '@/stores/auth.store';

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

  const [searchValue, setSearchValue] = useState(filters.search || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ search: value || undefined, page: 1 });
    }, 400);
  };

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <Input
          placeholder="Buscar por código o nombre..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-72 md:max-w-sm"
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
      {hasPermission("accounting:chart_of_accounts", "create") && (
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Agregar Cuenta
        </Button>
      )}

      <AccountPlanModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
