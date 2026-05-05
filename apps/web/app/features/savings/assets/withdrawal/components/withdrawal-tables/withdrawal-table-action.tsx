import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { useWithdrawalTypesQuery } from '../../hooks/use-withdrawal-query';
import { ESTATUS_TYPES } from '../../schemas/withdrawal-options';
import { useWithdrawalFilters } from '../../hooks/use-withdrawal-filters';

const STATUS_OPTIONS = Object.entries(ESTATUS_TYPES).map(([value, label]) => ({
  value,
  label,
}));

export function WithdrawalTableAction() {
  const { filters, setFilters } = useWithdrawalFilters();
  const navigate = useNavigate();

  const { data: typesResponse } = useWithdrawalTypesQuery();

  const typeOptions =
    typesResponse?.data?.map((t) => ({
      value: t.id.toString(),
      label: t.description,
    })) || [];

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 grow">
        <DataTableSearch
          title="Buscar por Cédula"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={(v) => setFilters({ search: v })}
          setPage={(p) => setFilters({ page: p })}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estatus"
          options={STATUS_OPTIONS}
          filterValue={filters.status || ''}
          setFilterValue={(v) => setFilters({ status: v })}
        />
        <DataTableFilterBox
          filterKey="type"
          title="Tipo"
          options={typeOptions}
          filterValue={filters.type || ''}
          setFilterValue={(v) => setFilters({ type: v })}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => navigate('nuevo')} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Agregar Retiro
        </Button>
      </div>
    </div>
  );
}
