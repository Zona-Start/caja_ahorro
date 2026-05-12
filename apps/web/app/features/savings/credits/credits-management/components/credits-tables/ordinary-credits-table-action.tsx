'use client';

import { Button } from '@repo/shadcn/button';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { useCreditsFilters } from '../../hooks/use-credits-filters';
import { ESTATUS_TYPES } from '../../schemas/credits-management-options';

export function OrdinaryCreditsTableAction() {
  const { filters, setFilters } = useCreditsFilters();

  const STATUS_OPTIONS = Object.entries(ESTATUS_TYPES).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
        <DataTableSearch
          title="Buscar por cédula o nombre"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={(v) => setFilters({ search: v })}
          setPage={(p) => setFilters({ page: p })}
        />

        <Select
          value={filters.status || ''}
          onValueChange={(value) =>
            setFilters({ status: value === 'all' ? '' : value })
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Link to="/dashboard/caja-ahorro/creditos/nuevo">
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Crédito
        </Button>
      </Link>
    </div>
  );
}
