'use client';

import { useAuthStore } from '@/stores/auth.store';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { useTenantsQuery } from '../../../tenants/hooks/use-tenants-queries';
import type { RolesFilters } from '../../hooks/use-roles-filters';

interface RolesFiltersActionProps {
  filters: RolesFilters;
  setFilters: (newFilters: Partial<RolesFilters>) => void;
}

export function RolesFiltersAction({
  filters,
  setFilters,
}: RolesFiltersActionProps) {
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
        title="Buscar roles"
        searchKey="q"
        searchQuery={filters.search || ''}
        setSearchQuery={(q) => setFilters({ search: q })}
        setPage={(p) => setFilters({ page: p })}
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
