import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { Input } from '@repo/shadcn/input';
import { Plus, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { useBankMovementsFilters } from '../../hooks/use-bank-movements-filters';
import {
  PAYMENT_METHOD_OPTIONS,
  CATEGORY_OPTIONS,
} from '../../schemas/bank-movement-options';
import { BankMovementModal } from '../bank-movement-modal';

const PAYMENT_METHOD_OPTIONS_LIST = Object.entries(PAYMENT_METHOD_OPTIONS).map(([v, l]) => ({ value: v, label: l }));
const CATEGORY_OPTIONS_LIST = Object.entries(CATEGORY_OPTIONS).map(([v, l]) => ({ value: v, label: l }));

const LINK_STATUS_OPTIONS = [
  { value: 'LINKED', label: 'Vinculado' },
  { value: 'UNLINKED', label: 'Sin Vincular' },
];

export default function BankMovementTableAction() {
  const [open, setOpen] = useState(false);
  const { filters, setFilters } = useBankMovementsFilters();

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    if (debouncedSearch !== (filters.search || '')) {
      setFilters({ search: debouncedSearch || undefined, page: 1 });
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  return (
    <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
      <div className="flex items-center gap-3 flex-grow flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar descripción o referencia..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 w-[260px]"
          />
        </div>
        <DataTableFilterBox
          filterKey="paymentMethod"
          title="Método"
          options={PAYMENT_METHOD_OPTIONS_LIST}
          setFilterValue={(v) => setFilters({ paymentMethod: v as any })}
          filterValue={filters.paymentMethod || ''}
        />
        <DataTableFilterBox
          filterKey="category"
          title="Categoría"
          options={CATEGORY_OPTIONS_LIST}
          setFilterValue={(v) => setFilters({ category: v as any })}
          filterValue={filters.category || ''}
        />
        <DataTableFilterBox
          filterKey="internalLinkStatus"
          title="Vinculación"
          options={LINK_STATUS_OPTIONS}
          setFilterValue={(v) => setFilters({ internalLinkStatus: v as any })}
          filterValue={filters.internalLinkStatus || ''}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Movimiento
      </Button>

      <BankMovementModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
