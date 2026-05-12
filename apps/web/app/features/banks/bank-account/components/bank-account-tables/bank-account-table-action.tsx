import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useBankAccountFilters } from '../../hooks/use-bank-account-filters';
import {
  ACCOUNT_TYPE_OPTIONS,
  CURRENCY_CODE_OPTIONS,
  STATUS_OPTIONS,
} from '../../schemas/bank-account-options';
import { BankAccountModal } from '../bank-account-modal';

const ACCOUNT_TYPE_FILTER_OPTIONS = Object.entries(ACCOUNT_TYPE_OPTIONS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

const CURRENCY_FILTER_OPTIONS = Object.entries(CURRENCY_CODE_OPTIONS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

const STATUS_FILTER_OPTIONS = Object.entries(STATUS_OPTIONS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export default function BankAccountTableAction() {
  const [open, setOpen] = useState(false);
  const { filters, setFilters } = useBankAccountFilters();

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por nombre o número de cuenta"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={(v) => setFilters({ search: v })}
          setPage={(p) => setFilters({ page: p })}
        />
        <DataTableFilterBox
          filterKey="accountType"
          title="Tipo de Cuenta"
          options={ACCOUNT_TYPE_FILTER_OPTIONS}
          setFilterValue={(v) => setFilters({ accountType: v })}
          filterValue={filters.accountType || ''}
        />
        <DataTableFilterBox
          filterKey="currencyCode"
          title="Moneda"
          options={CURRENCY_FILTER_OPTIONS}
          setFilterValue={(v) => setFilters({ currencyCode: v })}
          filterValue={filters.currencyCode || ''}
        />
        <DataTableFilterBox
          filterKey="isActive"
          title="Estado"
          options={STATUS_FILTER_OPTIONS}
          setFilterValue={(v) => setFilters({ isActive: v })}
          filterValue={filters.isActive || ''}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Cuenta
      </Button>

      <BankAccountModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
