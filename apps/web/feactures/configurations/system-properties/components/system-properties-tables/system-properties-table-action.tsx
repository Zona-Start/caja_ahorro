'use client';

import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';

import {
  TYPE_OPTIONS,
  useSettingSystemTableFilters,
} from './use-system-properties-table-filters';

export default function SettingSystemTableAction({
  filterVisibility,
}: {
  filterVisibility: string;
}) {
  const { typeFilter, setTypeFilter, searchQuery, setPage, setSearchQuery } =
    useSettingSystemTableFilters();

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por nombre"
          searchKey={searchQuery}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        {filterVisibility === 'ALL' && (
          <DataTableFilterBox
            filterKey="type"
            title="Modulo"
            options={TYPE_OPTIONS}
            setFilterValue={setTypeFilter}
            filterValue={typeFilter}
          />
        )}
      </div>
    </div>
  );
}
