'use client';

import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Button } from '@repo/shadcn/button';
import { FileSpreadsheet, User } from 'lucide-react';
import {
  TYPE_LABEL,
  MOVEMENT_TYPE_LABEL,
  STATUS_LABEL,
} from '../../schemas/contribution-batches-options';
import type { ContributionBatchesFilters } from '../../hooks/use-contribution-batches-filters';
import type { Options } from 'nuqs';
import { useAuthStore } from '@/stores/auth.store';

interface ContributionBatchesTableActionProps {
  filters: ContributionBatchesFilters;
  setFilters: (
    newFilters: Partial<ContributionBatchesFilters>,
  ) => void;
  onCargaIndividual: () => void;
  onCargaMasiva: () => void;
}

const TYPE_OPTIONS = Object.entries(TYPE_LABEL).map(([value, label]) => ({
  value,
  label,
}));

const MOVEMENT_TYPE_OPTIONS = Object.entries(MOVEMENT_TYPE_LABEL).map(
  ([value, label]) => ({ value, label }),
);

const STATUS_OPTIONS = Object.entries(STATUS_LABEL).map(([value, label]) => ({
  value,
  label,
}));

export function ContributionBatchesTableAction({
  filters,
  setFilters,
  onCargaIndividual,
  onCargaMasiva,
}: ContributionBatchesTableActionProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const setSearchQueryDummy = (
    value: string | null,
    _options?: Options,
  ): Promise<URLSearchParams> => {
    setFilters({ search: value ?? '', page: 1 });
    return Promise.resolve(new URLSearchParams());
  };

  const setTypeDummy = (
    value: string | null,
    _options?: Options,
  ): Promise<URLSearchParams> => {
    setFilters({ type: value ?? '', page: 1 });
    return Promise.resolve(new URLSearchParams());
  };

  const setMovementTypeDummy = (
    value: string | null,
    _options?: Options,
  ): Promise<URLSearchParams> => {
    setFilters({ movementType: value ?? '', page: 1 });
    return Promise.resolve(new URLSearchParams());
  };

  const setStatusDummy = (
    value: string | null,
    _options?: Options,
  ): Promise<URLSearchParams> => {
    setFilters({ status: value ?? '', page: 1 });
    return Promise.resolve(new URLSearchParams());
  };

  const setPageDummy = (
    value: number | null,
    _options?: Options,
  ): Promise<URLSearchParams> => {
    setFilters({ page: value ?? 1 });
    return Promise.resolve(new URLSearchParams());
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por descripción"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={setSearchQueryDummy}
          setPage={setPageDummy}
        />
        <DataTableFilterBox
          filterKey="type"
          title="Tipo"
          options={TYPE_OPTIONS}
          setFilterValue={setTypeDummy}
          filterValue={filters.type || ''}
        />
        <DataTableFilterBox
          filterKey="movementType"
          title="Movimiento"
          options={MOVEMENT_TYPE_OPTIONS}
          setFilterValue={setMovementTypeDummy}
          filterValue={filters.movementType || ''}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estatus"
          options={STATUS_OPTIONS}
          setFilterValue={setStatusDummy}
          filterValue={filters.status || ''}
        />
      </div>
      <div className="flex gap-2 shrink-0">
        {hasPermission("savings:contributions", "create") && (
          <Button onClick={onCargaIndividual} size="sm" className="gap-1.5">
            <User className="h-4 w-4" /> Carga Individual
          </Button>
        )}
        {hasPermission("savings:contributions", "mass_upload") && (
          <Button onClick={onCargaMasiva} size="sm" variant="outline" className="gap-1.5">
            <FileSpreadsheet className="h-4 w-4" /> Carga Masiva
          </Button>
        )}
      </div>
    </div>
  );
}
