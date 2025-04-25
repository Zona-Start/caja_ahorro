'use client';

import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { useTypeLoansFilters } from './use-type-loans-filters';

export default function TypeLoansTableAction() {
  const { searchQuery, setPage, setSearchQuery } = useTypeLoansFilters();

  return (
    <div className="flex flex-wrap items-center gap-4 pt-2">
      <DataTableSearch
        title="Buscar por nombre"
        searchKey={searchQuery}
        searchQuery={searchQuery || ''}
        setSearchQuery={setSearchQuery}
        setPage={setPage}
      />
    </div>
  );
}
