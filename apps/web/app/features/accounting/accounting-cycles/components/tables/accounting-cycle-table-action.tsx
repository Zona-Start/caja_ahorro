import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
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

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por descripción"
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
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Ciclo
      </Button>

      <AccountingCycleModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
