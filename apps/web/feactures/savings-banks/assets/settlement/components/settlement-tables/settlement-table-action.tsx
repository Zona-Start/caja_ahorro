'use client';
import { Button } from '@repo/shadcn/button';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useWithdrawalTableFilters } from './use-settlement-filters';

export default function WithdrawalTableAction() {
  const { typeFilter, setTypeFilter, searchQuery, setPage, setSearchQuery } =
    useWithdrawalTableFilters();

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por cédula"
          searchKey={String(/^\d/.test(searchQuery || ''))}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
      </div>
      <Link href="/dashboard/haberes/liquidacion/nueva">
        <Button size="sm">
          <Plus className="h-4 w-4" /> Nuevo Liquidación
        </Button>
      </Link>
    </div>
  );
}
