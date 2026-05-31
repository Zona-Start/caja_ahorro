import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { Input } from '@repo/shadcn/input';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AccountingCycleModal } from '../accounting-cycle-modal';
import { useAccountingCyclesFilters } from '../../hooks/use-accounting-cycles-filters';
import { CYCLE_STATUS_OPTIONS } from '../../schemas/accounting-cycle-options';

const STATUS_OPTIONS = Object.entries(CYCLE_STATUS_OPTIONS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export default function AccountingCycleTableAction() {
  const [open, setOpen] = useState(false);
  const { filters, setFilters } = useAccountingCyclesFilters();

  const [searchValue, setSearchValue] = useState(filters.search || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Ciclo
      </Button>

      <AccountingCycleModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
