'use client';
import { Button } from '@repo/shadcn/button';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useBankReconciliationTableFilters } from './use-banks-reconciliation-table-filters';
import Link from 'next/link';

export default function BanksReconciliationTableAction() {
  const { searchQuery, setPage, setSearchQuery } = useBankReconciliationTableFilters();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 grow">
        <DataTableSearch
          title="Buscar por nombre"
          searchKey={searchQuery}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
      </div>
      <Link href="/dashboard/bancos/conciliacion-bancaria/nueva">
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Nueva Conciliación
        </Button>
      </Link>
    </div>
  );
}
