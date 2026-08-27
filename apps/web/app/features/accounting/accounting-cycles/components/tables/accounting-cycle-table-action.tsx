import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AccountingCycleModal } from '../accounting-cycle-modal';
import { useAccountingCyclesFilters } from '../../hooks/use-accounting-cycles-filters';
import { CYCLE_STATUS_FILTER_OPTIONS } from '../../schemas/accounting-cycle-options';
import { useAuthStore } from '@/stores/auth.store';

export default function AccountingCycleTableAction() {
  const [open, setOpen] = useState(false);
  const { filters, setFilters } = useAccountingCyclesFilters();

  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [startDate, setStartDate] = useState(filters.startDate || '');
  const [endDate, setEndDate] = useState(filters.endDate || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    setStartDate(filters.startDate || '');
  }, [filters.startDate]);

  useEffect(() => {
    setEndDate(filters.endDate || '');
  }, [filters.endDate]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ search: value || '', page: 1 });
    }, 400);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ startDate: value || '', page: 1 });
    }, 400);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ endDate: value || '', page: 1 });
    }, 400);
  };

  return (
    <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 flex-grow">
        <Input
          placeholder="Buscar por descripción..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-64 max-w-sm"
        />
        <select
          value={filters.status || ''}
          onChange={(e) =>
            setFilters({ status: e.target.value || '', page: 1 })
          }
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          {CYCLE_STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-40"
            placeholder="Fecha desde"
          />
          <span className="text-muted-foreground text-sm">a</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="w-40"
            placeholder="Fecha hasta"
          />
        </div>
      </div>
      {hasPermission("accounting:cycles", "create") && (
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Agregar Ciclo
        </Button>
      )}

      <AccountingCycleModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
