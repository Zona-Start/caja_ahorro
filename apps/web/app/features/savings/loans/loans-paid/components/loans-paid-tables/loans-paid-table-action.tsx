'use client';

import { Plus, UploadCloud } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { LOAN_PAYMENT_TYPES, PAYMENT_METHOD } from '../../schemas/loans-paid-options';
import { useLoansPaidFilters } from '../../hooks/use-loans-paid-filters';
import { useAuthStore } from '@/stores/auth.store';

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
  onBulkClick: () => void;
}

export function LoansPaidTableAction({ onCreateClick, onBulkClick }: Props) {
  const { filters, setFilters } = useLoansPaidFilters();
  const hasPermission = useAuthStore((state) => state.hasPermission);

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
        {hasPermission('portfolio:payments-loans', 'create') && (
          <>
            <Button onClick={onBulkClick} size="sm" variant="outline">
              <UploadCloud className="mr-2 h-4 w-4" /> Carga Masiva
            </Button>
            <Button onClick={onCreateClick} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Pago
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
