'use client';
import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import {
  LOAN_DISBURSEMENT_BATCH_STATUS_OPTIONS,
  useLoanDisbursementBatchTableFilters,
} from './use-loan-disbursement-batch-filters';

export default function LoanDisbursementBatchTableAction() {
  const {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setPage,
    setSearchQuery,
  } = useLoanDisbursementBatchTableFilters();

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por descripción"
          searchKey="description"
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estado"
          options={LOAN_DISBURSEMENT_BATCH_STATUS_OPTIONS}
          setFilterValue={setStatusFilter}
          filterValue={statusFilter}
        />
      </div>
      <Link href="/dashboard/haberes/desembolsos-asociados/nuevo">
        <Button size="sm">
          <Plus className="h-4 w-4" /> Nuevo Lote
        </Button>
      </Link>
    </div>
  );
}
