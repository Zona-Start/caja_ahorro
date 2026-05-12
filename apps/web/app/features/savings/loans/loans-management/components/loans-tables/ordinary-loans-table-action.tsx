'use client';

import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { useLoanTypesQuery } from '../../../type-loans/hooks/use-type-loans-query';
import {
  ESTATUS_TYPES,
  LOAN_MODALITY,
} from '../../schemas/loans-management-options';
import { type LoansFilters } from '../../hooks/use-loans-filters';
import type { Options } from 'nuqs';

interface LoansTableActionProps {
  filters: LoansFilters;
  setFilters: (newFilters: Partial<LoansFilters>) => void;
}

const ESTATUS_OPTIONS = Object.entries(ESTATUS_TYPES).map(([value, label]) => ({
  value,
  label,
}));

const LOAN_MODALITY_OPTIONS = Object.entries(LOAN_MODALITY).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export function LoansTableAction({
  filters,
  setFilters,
}: LoansTableActionProps) {
  const { data: loanTypes } = useLoanTypesQuery(
    { page: 1, limit: 100, sortBy: 'id', sortOrder: 'asc' },
    false,
  );

  const LOAN_TYPE_OPTIONS =
    loanTypes?.data?.map((loanType) => ({
      value: String(loanType.id),
      label: loanType.name,
    })) ?? [];

  const setSearchQueryDummy = (
    value: string | null,
    _options?: Options,
  ): Promise<URLSearchParams> => {
    setFilters({ search: value ?? '', page: 1 });
    return Promise.resolve(new URLSearchParams());
  };

  const setStatusDummy = (
    value: string | null,
    _options?: Options,
  ): Promise<URLSearchParams> => {
    setFilters({ status: value ?? '', page: 1 });
    return Promise.resolve(new URLSearchParams());
  };

  const setTypeDummy = (
    value: string | null,
    _options?: Options,
  ): Promise<URLSearchParams> => {
    setFilters({ type: value ?? '', page: 1 });
    return Promise.resolve(new URLSearchParams());
  };

  const setModalityDummy = (
    value: string | null,
    _options?: Options,
  ): Promise<URLSearchParams> => {
    setFilters({ modality: value ?? '', page: 1 });
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
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por nombre o cédula"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={setSearchQueryDummy}
          setPage={setPageDummy}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estatus"
          options={ESTATUS_OPTIONS}
          setFilterValue={setStatusDummy}
          filterValue={filters.status || ''}
        />
        <DataTableFilterBox
          filterKey="type"
          title="Tipo de Préstamo"
          options={LOAN_TYPE_OPTIONS}
          setFilterValue={setTypeDummy}
          filterValue={filters.type || ''}
        />
        <DataTableFilterBox
          filterKey="modality"
          title="Modalidad"
          options={LOAN_MODALITY_OPTIONS}
          setFilterValue={setModalityDummy}
          filterValue={filters.modality || ''}
        />
      </div>
      <Link to="/dashboard/prestamos/gestion/nuevo">
        <Button size="sm">
          <Plus className="h-4 w-4" /> Nuevo Préstamo
        </Button>
      </Link>
    </div>
  );
}
