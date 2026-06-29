import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { Input } from '@repo/shadcn/input';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MovementsModal } from '../movements-modal';
import { useMovementsFilters } from '../../hooks/use-movements-filters';
import {
  MOVEMENT_TYPE_OPTIONS,
  MOVEMENT_STATUS_OPTIONS,
} from '../../schemas/movements-options';
import { useMovementsModalStore } from '../../store/movements-modal.store';

const TYPE_OPTIONS = Object.entries(MOVEMENT_TYPE_OPTIONS).map(([value, label]) => ({
  value,
  label,
}));

const STATUS_OPTIONS = Object.entries(MOVEMENT_STATUS_OPTIONS).map(([value, label]) => ({
  value,
  label,
}));

export default function MovementsTableAction() {
  const { filters, setFilters } = useMovementsFilters();
  const { openModal } = useMovementsModalStore();
  const [searchValue, setSearchValue] = useState(filters.search ?? '');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== (filters.search ?? '')) {
        setFilters({ search: searchValue || '', page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    setSearchValue(filters.search ?? '');
  }, [filters.search]);

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 flex-grow flex-wrap">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número o descripción..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
        <DataTableFilterBox
          filterKey="movementType"
          title="Tipo"
          options={TYPE_OPTIONS}
          setFilterValue={(v) => setFilters({ movementType: v, page: 1 })}
          filterValue={filters.movementType ?? ''}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estado"
          options={STATUS_OPTIONS}
          setFilterValue={(v) => setFilters({ status: v, page: 1 })}
          filterValue={filters.status ?? ''}
        />
      </div>
      <Button onClick={() => openModal('create')} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Nuevo Movimiento
      </Button>
      <MovementsModal />
    </div>
  );
}
