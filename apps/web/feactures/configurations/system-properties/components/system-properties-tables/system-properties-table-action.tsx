'use client';

import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import {
  TYPE_OPTIONS,
  useSettingSystemTableFilters,
} from './use-system-properties-table-filters';

export default function SettingSystemTableAction() {
  const { typeFilter, setTypeFilter, searchQuery, setPage, setSearchQuery } =
    useSettingSystemTableFilters();

  return (
    <div className="flex flex-wrap items-center gap-4 pt-2">
      <DataTableSearch
        title="Buscar por nombre"
        searchKey={searchQuery}
        searchQuery={searchQuery || ''}
        setSearchQuery={setSearchQuery}
        setPage={setPage}
      />
      <DataTableFilterBox
        filterKey="type"
        title="Modulo"
        options={TYPE_OPTIONS}
        setFilterValue={setTypeFilter}
        filterValue={typeFilter}
      />
    </div>
  );
}
