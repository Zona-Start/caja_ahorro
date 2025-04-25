'use client';

import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { useTransactionTypeFilters } from './use-transaction-type-filters';

export default function TransactionTypeTableAction() {
  const { searchQuery, setPage, setSearchQuery } = useTransactionTypeFilters();

  return (
    <div className="flex flex-wrap items-center gap-4 pt-2">
      <DataTableSearch
        title="Buscar por descripción"
        searchKey={searchQuery}
        searchQuery={searchQuery || ''}
        setSearchQuery={setSearchQuery}
        setPage={setPage}
      />
    </div>
  );
}
