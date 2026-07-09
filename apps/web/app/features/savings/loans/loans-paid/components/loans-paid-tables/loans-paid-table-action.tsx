'use client';

import { Plus } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { LOAN_PAYMENT_TYPES, PAYMENT_METHOD } from '../../schemas/loans-paid-options';
import { useLoansPaidFilters } from '../../hooks/use-loans-paid-filters';

const TYPE_OPTIONS = (Object.entries(LOAN_PAYMENT_TYPES) as [string, string][]).map(([value, label]) => ({
  value,
  label,
}));

const METHOD_OPTIONS = (Object.entries(PAYMENT_METHOD) as [string, string][]).map(([value, label]) => ({
  value,
  label,
}));

interface Props {
  onCreateClick: () => void;
}

export function LoansPaidTableAction({ onCreateClick }: Props) {
  const { filters, setFilters } = useLoansPaidFilters();

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 grow">
        <DataTableSearch
          title="Buscar por referencia"
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
        <Button onClick={onCreateClick} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Pago
        </Button>
      </div>
    </div>
  );
}
