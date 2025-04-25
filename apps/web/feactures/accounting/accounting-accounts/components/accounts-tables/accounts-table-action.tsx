'use client';

import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import {
  LEVEL_OPTIONS,
  TYPE_OPTIONS,
  useAccountsTableFilters,
} from './use-accounts-table-filters';

export default function AccountsTableAction() {
  const {
    typeFilter,
    setTypeFilter,
    levelFilter,
    setLevelFilter,
    searchQuery,
    setPage,
    setSearchQuery,
  } = useAccountsTableFilters();

  return (
    <div className="flex flex-wrap items-center gap-4 pt-2">
      <DataTableSearch
        title="Buscar por código o nombre"
        searchKey={String(/^\d/.test(searchQuery))}
        searchQuery={searchQuery || ''}
        setSearchQuery={setSearchQuery}
        setPage={setPage}
      />
      <DataTableFilterBox
        filterKey="type"
        title="Tipo de Cuenta"
        options={TYPE_OPTIONS}
        setFilterValue={setTypeFilter}
        filterValue={typeFilter}
      />
      <DataTableFilterBox
        filterKey="level"
        title="Nivel"
        options={LEVEL_OPTIONS}
        setFilterValue={setLevelFilter}
        filterValue={levelFilter}
      />
      {/* <DataTableResetFilter
        isFilterActive={isAnyFilterActive}
        onReset={resetFilters}
      /> */}
    </div>
  );
}
