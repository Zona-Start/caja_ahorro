'use client';

import { useAuthStore } from '@/stores/auth.store';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { useTenantsQuery } from '../../../tenants/hooks/use-tenants-queries';
import type { UsersFilters } from '../../hooks/use-users-filters';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'blocked', label: 'Bloqueado' },
];

interface UsersFiltersActionProps {
  filters: UsersFilters;
  setFilters: (newFilters: Partial<UsersFilters>) => void;
}

export function UsersFiltersAction({
  filters,
  setFilters,
}: UsersFiltersActionProps) {
  const { user } = useAuthStore();
  const isSystemAdmin = user?.isSystemAdmin ?? false;

  const { data: tenantsData } = useTenantsQuery(
    { page: 1, limit: 100, isActive: 'true', search: '' },
    isSystemAdmin,
  );

  const tenantOptions =
    tenantsData?.data?.map((t) => ({
      value: t.id,
      label: t.name,
    })) ?? [];

  return (
    <div className="flex items-center gap-4 grow">
      <DataTableSearch
        title="Buscar usuarios"
        searchKey="q"
        searchQuery={filters.search || ''}
        setSearchQuery={(q) => setFilters({ search: q })}
        setPage={(p) => setFilters({ page: p })}
      />

      <DataTableFilterBox
        filterKey="status"
        title="Estado"
        options={STATUS_OPTIONS}
        setFilterValue={(v) =>
          setFilters({ status: v || undefined, page: 1 })
        }
        filterValue={filters.status || ''}
      />

      {isSystemAdmin && (
        <DataTableFilterBox
          filterKey="tenantId"
          title="Empresa"
          options={tenantOptions}
          setFilterValue={(v) =>
            setFilters({ tenantId: v || undefined, page: 1 })
          }
          filterValue={filters.tenantId || ''}
        />
      )}
    </div>
  );
}
