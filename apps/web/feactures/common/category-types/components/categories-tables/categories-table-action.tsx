'use client';

import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { useCategoriesTypesTableFilters } from './use-categories-table-filters';

export default function CategoriesTypesTableAction({
  inputTitle,
}: {
  inputTitle: string;
}) {
  const { setGrouFilter, groupFilter, searchQuery, setPage, setSearchQuery } =
    useCategoriesTypesTableFilters();

  return (
    <div className="flex flex-wrap items-center gap-4 pt-2">
      <DataTableSearch
        title={inputTitle}
        searchKey={searchQuery}
        searchQuery={searchQuery || ''}
        setSearchQuery={setSearchQuery}
        setPage={setPage}
      />
      {/* <DataTableFilterBox
        filterKey="type"
        title="Tipo de Cuenta"
        options={groupFilter}
        setFilterValue={setGrouFilter}
        filterValue={groupFilter}
      /> */}
    </div>
  );
}
