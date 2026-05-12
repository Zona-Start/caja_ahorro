import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useBankMovementsFilters } from '../../hooks/use-bank-movements-filters';
import {
  PAYMENT_METHOD_OPTIONS,
  CATEGORY_OPTIONS,
} from '../../schemas/bank-movement-options';
import { BankMovementModal } from '../bank-movement-modal';

const PAYMENT_METHOD_FILTER_OPTIONS = Object.entries(PAYMENT_METHOD_OPTIONS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

const CATEGORY_FILTER_OPTIONS = Object.entries(CATEGORY_OPTIONS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export default function BankMovementTableAction() {
  const [open, setOpen] = useState(false);
  const { filters, setFilters } = useBankMovementsFilters();

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por descripción o referencia"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={(v) => setFilters({ search: v })}
          setPage={(p) => setFilters({ page: p })}
        />
        <DataTableFilterBox
          filterKey="paymentMethod"
          title="Método de Pago"
          options={PAYMENT_METHOD_FILTER_OPTIONS}
          setFilterValue={(v) => setFilters({ paymentMethod: v })}
          filterValue={filters.paymentMethod || ''}
        />
        <DataTableFilterBox
          filterKey="category"
          title="Categoría"
          options={CATEGORY_FILTER_OPTIONS}
          setFilterValue={(v) => setFilters({ category: v })}
          filterValue={filters.category || ''}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Movimiento
      </Button>

      <BankMovementModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
