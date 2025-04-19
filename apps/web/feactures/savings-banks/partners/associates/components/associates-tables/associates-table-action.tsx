'use client';

import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import {
  ESTATUS_OPTIONS,
  PAYROLL_OPTIONS,
  useAssociatesTableFilters,
} from './use-associates-filters';

export default function AssociatesTableAction() {
  const {
    statusFilter,
    setStatusFilter,
    payrollFilter,
    setPayrollFilter,
    searchQuery,
    setPage,
    setSearchQuery,
  } = useAssociatesTableFilters();

  return (
    <div className="flex flex-wrap items-center gap-4 pt-2">
      <DataTableSearch
        searchKey={/^\d/.test(searchQuery || '') ? 'code' : 'name'}
        searchQuery={searchQuery || ''}
        setSearchQuery={setSearchQuery}
        setPage={setPage}
      />
      <DataTableFilterBox
        filterKey="Por estatus"
        title="Estatus"
        options={ESTATUS_OPTIONS}
        setFilterValue={setStatusFilter}
        filterValue={statusFilter}
      />
      <DataTableFilterBox
        filterKey="payroll"
        title="Por CrediNomina"
        options={PAYROLL_OPTIONS}
        setFilterValue={setPayrollFilter}
        filterValue={payrollFilter}
      />
    </div>
  );
}
