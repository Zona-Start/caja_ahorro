import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { useWithdrawalTypesFilters } from '../../hooks/use-withdrawal-types-filters';
import { WithdrawalTypesModal } from '../withdrawal-types-modal';

export function WithdrawalTypesTableAction() {
  const { filters, setFilters } = useWithdrawalTypesFilters();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 grow">
        <DataTableSearch
          title="Buscar por descripción"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={(v) => setFilters({ search: v })}
          setPage={(p) => setFilters({ page: p })}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Tipo
      </Button>

      <WithdrawalTypesModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
