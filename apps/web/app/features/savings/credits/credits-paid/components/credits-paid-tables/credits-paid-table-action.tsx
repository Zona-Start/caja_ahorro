'use client';

import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { CREDIT_PAYMENT_TYPES, PAYMENT_METHOD } from '../schemas/credits-paid-options';
import { useCreditsPaidFilters } from '../hooks/use-credits-paid-filters';

const TYPE_OPTIONS = Object.entries(CREDIT_PAYMENT_TYPES).map(([value, label]) => ({
  value,
  label,
}));

const METHOD_OPTIONS = Object.entries(PAYMENT_METHOD).map(([value, label]) => ({
  value,
  label,
}));

export function CreditsPaidTableAction() {
  const { filters, setFilters } = useCreditsPaidFilters();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 grow">
        <DataTableSearch
          title="Buscar por cédula o nombre"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={(v) => setFilters({ search: v })}
          setPage={(p) => setFilters({ page: p })}
        />
        <DataTableFilterBox
          filterKey="type"
          title="Tipo de Pago"
          options={TYPE_OPTIONS}
          filterValue={filters.type || ''}
          setFilterValue={(v) => setFilters({ type: v })}
        />
        <DataTableFilterBox
          filterKey="method"
          title="Método"
          options={METHOD_OPTIONS}
          filterValue={filters.method || ''}
          setFilterValue={(v) => setFilters({ method: v })}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => navigate('nuevo')} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Registrar Pago
        </Button>
      </div>
    </div>
  );
}
