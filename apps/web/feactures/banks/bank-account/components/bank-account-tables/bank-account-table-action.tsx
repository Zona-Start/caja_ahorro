'use client';

import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { BankAccountModal } from '../bank-account-modal';
import {
  ACCOUNTS_OPTIONS,
  CURRENCIES_OPTIONS,
  ESTATUS_OPTIONS,
  useBankAccountFilters,
} from './use-ordinary-loans-filters';

export default function BankAccountTableAction() {
  const {
    statusFilter,
    setStatusFilter,
    accountTypeFilter,
    setAccountTypeFilter,
    searchQuery,
    setPage,
    setSearchQuery,
    curenciesFilter,
    setCurenciesFilter,
  } = useBankAccountFilters();

  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por número cuenta"
          searchKey={searchQuery}
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
          filterKey="accountType"
          title="Tipo de Cuenta"
          options={ACCOUNTS_OPTIONS}
          setFilterValue={setAccountTypeFilter}
          filterValue={accountTypeFilter}
        />
        <DataTableFilterBox
          filterKey="accountType"
          title="Tipo de Moneda"
          options={CURRENCIES_OPTIONS}
          setFilterValue={setCurenciesFilter}
          filterValue={curenciesFilter}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4" /> Nuevo Cuenta
      </Button>

      <BankAccountModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
