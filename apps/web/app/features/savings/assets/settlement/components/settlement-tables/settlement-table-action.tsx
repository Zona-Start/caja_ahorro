'use client';
import { Button } from '@repo/shadcn/button';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { useWithdrawalTableFilters } from './use-settlement-filters';

export function SettlementTableAction() {
  const { filters, setFilters } = useWithdrawalTableFilters();

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por cédula"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={(v) => setFilters({ search: v })}
          setPage={(p) => setFilters({ page: p })}
        />
      </div>
      <Link to="/dashboard/caja-ahorro/liquidacion/nueva">
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Nueva Liquidación
        </Button>
      </Link>
    </div>
  );
}
