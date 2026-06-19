import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import type { TenantsFilters } from '../../hooks/use-tenants-filters';

const BUSINESS_TYPE_OPTIONS = [
  { value: 'CAJA_AHORRO', label: 'Caja de Ahorro' },
  { value: 'EMPRESA_COMERCIAL', label: 'Empresa Comercial' },
];

const ACTIVE_OPTIONS = [
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
];

interface TenantsFiltersActionProps {
  filters: TenantsFilters;
  setFilters: (newFilters: Partial<TenantsFilters>) => void;
}

export function TenantsFiltersAction({
  filters,
  setFilters,
}: TenantsFiltersActionProps) {
  return (
    <div className="flex items-center gap-4 grow">
      <DataTableSearch
        title="Buscar clientes"
        searchKey="q"
        searchQuery={filters.search || ''}
        setSearchQuery={(q) => setFilters({ search: q })}
        setPage={(p) => setFilters({ page: p })}
      />

      <DataTableFilterBox
        filterKey="isActive"
        title="Estado"
        options={ACTIVE_OPTIONS}
        setFilterValue={(v) =>
          setFilters({ isActive: (v ?? 'all') as 'all' | 'true' | 'false', page: 1 })
        }
        filterValue={filters.isActive === 'all' ? '' : filters.isActive}
      />

      <DataTableFilterBox
        filterKey="businessType"
        title="Tipo"
        options={BUSINESS_TYPE_OPTIONS}
        setFilterValue={(v) =>
          setFilters({ businessType: (v ?? 'all') as 'all' | 'CAJA_AHORRO' | 'EMPRESA_COMERCIAL', page: 1 })
        }
        filterValue={filters.businessType === 'all' ? '' : (filters.businessType || '')}
      />
    </div>
  );
}
