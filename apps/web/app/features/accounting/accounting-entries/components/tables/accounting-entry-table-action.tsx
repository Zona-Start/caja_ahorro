import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { Input } from '@repo/shadcn/input';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAccountingCycles } from '../../../accounting-cycles/hooks/use-accounting-cycles-query';
import { AccountingEntryModal } from '../accounting-entry-modal';
import { useAccountingEntriesFilters } from '../../hooks/use-accounting-entries-filters';
import { ENTRY_STATUS } from '../../schemas/accounting-entry-options';
import { useAuthStore } from '@/stores/auth.store';

const STATUS_OPTIONS = Object.entries(ENTRY_STATUS).map(([value, label]) => ({
  value,
  label,
}));

export default function AccountingEntryTableAction() {
  const [open, setOpen] = useState(false);
  const { filters, setFilters } = useAccountingEntriesFilters();
  const { data: cycles } = useAccountingCycles();

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

  const cycleOptions =
    cycles?.map((cycle: any) => ({
      value: cycle.id!.toString(),
      label: cycle.description as string,
    })) || [];

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <Input
          placeholder="Buscar por descripción..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-72 md:max-w-sm"
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estado"
          options={STATUS_OPTIONS}
          setFilterValue={(v) => setFilters({ status: v, page: 1 })}
          filterValue={filters.status || ''}
        />
        <DataTableFilterBox
          filterKey="accountingCycleId"
          title="Ciclo Contable"
          options={cycleOptions}
          setFilterValue={(v) => setFilters({ accountingCycleId: v, page: 1 })}
          filterValue={filters.accountingCycleId || ''}
        />
      </div>
      {hasPermission("accounting:journal_entries", "create") && (
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Crear Asiento
        </Button>
      )}

      <AccountingEntryModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
