'use client';

import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { useBanksTableFilters } from './use-banks-table-filters';

export default function AccountsTableAction() {
  const { searchQuery, setPage, setSearchQuery } = useBanksTableFilters();

  return (
    <div className="flex flex-wrap items-center gap-4 pt-2">
      <DataTableSearch
        searchKey={searchQuery}
        searchQuery={searchQuery || ''}
        setSearchQuery={setSearchQuery}
        setPage={setPage}
      />
    </div>
  );
}
