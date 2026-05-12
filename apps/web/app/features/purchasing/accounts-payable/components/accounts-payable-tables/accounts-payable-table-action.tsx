import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { useAccountsPayableFilters } from '../../hooks/use-accounts-payable-filters';
import { STATUS_OPTIONS } from '../../schemas/accounts-payable-options';

const STATUS_FILTER_OPTIONS = Object.entries(STATUS_OPTIONS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export default function AccountsPayableTableAction() {
  const { filters, setFilters } = useAccountsPayableFilters();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por proveedor, N° factura o RIF"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={(v) => setFilters({ search: v })}
          setPage={(p) => setFilters({ page: p })}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estado"
          options={STATUS_FILTER_OPTIONS}
          setFilterValue={(v) => setFilters({ status: v })}
          filterValue={filters.status || ''}
        />
      </div>
    </div>
  );
}
