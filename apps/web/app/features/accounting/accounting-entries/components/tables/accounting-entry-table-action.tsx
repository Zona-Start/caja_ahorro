import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { Input } from '@repo/shadcn/input';
import { FileUp, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAccountingCycles } from '../../../accounting-cycles/hooks/use-accounting-cycles-query';
import { AccountingEntryImportModal } from '../accounting-entry-import-modal';
import { AccountingEntryModal } from '../accounting-entry-modal';
import { useAccountingEntriesFilters } from '../../hooks/use-accounting-entries-filters';
import { ENTRY_STATUS } from '../../schemas/accounting-entry-options';
import { useAuthStore } from '@/stores/auth.store';

const STATUS_OPTIONS = Object.entries(ENTRY_STATUS).map(([value, label]) => ({
  value,
  label,
}));

const SEARCH_TYPE_OPTIONS = [
  { value: 'voucher', label: 'N° Comprobante' },
  { value: 'description', label: 'Descripción' },
];

export default function AccountingEntryTableAction() {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const { filters, setFilters } = useAccountingEntriesFilters();
  const { data: cycles } = useAccountingCycles();

  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [startDate, setStartDate] = useState(filters.startDate || '');
  const [endDate, setEndDate] = useState(filters.endDate || '');
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startDateRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endDateRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setFilters({ search: value || undefined, page: 1 });
    }, 400);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (startDateRef.current) clearTimeout(startDateRef.current);
    startDateRef.current = setTimeout(() => {
      setFilters({ startDate: value || undefined, page: 1 });
    }, 400);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    if (endDateRef.current) clearTimeout(endDateRef.current);
    endDateRef.current = setTimeout(() => {
      setFilters({ endDate: value || undefined, page: 1 });
    }, 400);
  };

  const cycleOptions =
    cycles?.map((cycle: any) => ({
      value: cycle.id!.toString(),
      label: cycle.description as string,
    })) || [];

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <DataTableFilterBox
            filterKey="searchType"
            title="Buscar por"
            options={SEARCH_TYPE_OPTIONS}
            setFilterValue={(v) => setFilters({ searchType: v, page: 1 })}
            filterValue={filters.searchType || ''}
          />
          <Input
            placeholder={
              filters.searchType === 'voucher'
                ? 'N° de comprobante...'
                : filters.searchType === 'description'
                  ? 'Buscar por descripción...'
                  : 'Buscar por N° comprobante o descripción...'
            }
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-72 md:max-w-sm"
          />
        </div>
        {hasPermission('accounting:journal_entries', 'create') && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              size="sm"
            >
              <FileUp className="mr-2 h-4 w-4" /> Importar Excel
            </Button>
            <Button onClick={() => setOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Crear Asiento
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-40"
            title="Fecha del asiento desde"
          />
          <span className="text-muted-foreground text-sm">a</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="w-40"
            title="Fecha del asiento hasta"
          />
        </div>
      </div>

      <AccountingEntryModal open={open} onOpenChange={setOpen} />
      <AccountingEntryImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </div>
  );
}
