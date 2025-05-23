'use client';

import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useTypeLoans } from '../../../type-loans/hooks/use-query-type-loans';
import {
  ESTATUS_OPTIONS,
  lOAN_MODALITY_OPTIONS,
  useAssociatesTableFilters,
} from './use-ordinary-loans-filters';

export default function LoansTableAction() {
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
  } = useAssociatesTableFilters();

  const { data: loanTypes } = useTypeLoans();
  const LOAN_TYPE_OPTIONS =
    loanTypes?.data?.map((loanType) => ({
      value: loanType?.id?.toString() ?? '',
      label: loanType?.name ?? '',
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
          title="Tipo de Préstamo"
          options={LOAN_TYPE_OPTIONS}
          setFilterValue={setTypeFilter}
          filterValue={typeFilter}
        />
        <DataTableFilterBox
          filterKey="modality"
          title="Modalidad"
          options={lOAN_MODALITY_OPTIONS}
          setFilterValue={setModalityFilter}
          filterValue={modalityFilter}
        />
      </div>
      <Link href="/dashboard/prestamos/gestion/nuevo">
        <Button size="sm">
          <Plus className="h-4 w-4" /> Nuevo Préstamos
        </Button>
      </Link>
    </div>
  );
}
