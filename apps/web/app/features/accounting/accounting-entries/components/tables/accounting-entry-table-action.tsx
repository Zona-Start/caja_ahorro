import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useAccountingCycles } from '../../../accounting-cycles/hooks/use-accounting-cycles-query';
import { AccountingEntryModal } from '../accounting-entry-modal';
import { useAccountingEntriesFilters } from '../../hooks/use-accounting-entries-filters';
import { ENTRY_STATUS } from '../../schemas/accounting-entry-options';

const STATUS_OPTIONS = Object.entries(ENTRY_STATUS).map(([value, label]) => ({
  value,
  label,
}));

export default function AccountingEntryTableAction() {
  const [open, setOpen] = useState(false);
  const { filters, setFilters } = useAccountingEntriesFilters();
  const { data: cycles } = useAccountingCycles();

  const cycleOptions =
    cycles?.map((cycle: any) => ({
      value: cycle.id!.toString(),
      label: cycle.description as string,
    })) || [];

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por descripción..."
          searchKey="description"
          searchQuery={filters.search || ''}
          setSearchQuery={(v) => setFilters({ search: v, page: 1 })}
          setPage={(p) => setFilters({ page: p })}
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
          setFilterValue={(v) => setFilters({ accountingCycleId: v ? Number(v) : undefined, page: 1 })}
          filterValue={filters.accountingCycleId?.toString() ?? ''}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Crear Asiento
      </Button>

      <AccountingEntryModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
