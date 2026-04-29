'use client';

import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useTypeCredits } from '../../../type-credits/hooks/use-query-type-credits';
import {
  CREDIT_MODALITY_OPTIONS,
  ESTATUS_OPTIONS,
  useCreditTableFilters,
} from './use-ordinary-credits-filters';

export default function CreditsTableAction() {
  const {
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    searchQuery,
    setPage,
    setSearchQuery,
    setModalityFilter,
    modalityFilter,
  } = useCreditTableFilters();

  const { data: loanCredits } = useTypeCredits();
  const LOAN_TYPE_OPTIONS =
    loanCredits?.data?.map((creditType) => ({
      value: creditType?.id?.toString() ?? '',
      label: creditType?.name ?? '',
    })) ?? [];

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por nombre o cédula"
          searchKey={String(/^\d/.test(searchQuery || ''))}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estatus"
          options={ESTATUS_OPTIONS}
          setFilterValue={setStatusFilter}
          filterValue={statusFilter}
        />
        <DataTableFilterBox
          filterKey="type"
          title="Tipo de Crédito"
          options={LOAN_TYPE_OPTIONS}
          setFilterValue={setTypeFilter}
          filterValue={typeFilter}
        />
        <DataTableFilterBox
          filterKey="modality"
          title="Modalidad"
          options={CREDIT_MODALITY_OPTIONS}
          setFilterValue={setModalityFilter}
          filterValue={modalityFilter}
        />
      </div>
      <Link href="/dashboard/creditos/gestion/nuevo">
        <Button size="sm">
          <Plus className="h-4 w-4" /> Nuevo Crédito
        </Button>
      </Link>
    </div>
  );
}
