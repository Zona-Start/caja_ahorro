import { Button } from '@repo/shadcn/button';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useBankDirectoryFilters } from '../../hooks/use-bank-directory-filters';
import { BanksModal } from '../banks-modal';

export default function BanksTableAction() {
  const [open, setOpen] = useState(false);
  const { filters, setFilters } = useBankDirectoryFilters();

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por nombre o código"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={(v) => setFilters({ search: v })}
          setPage={(p) => setFilters({ page: p })}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Banco
      </Button>

      <BanksModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
