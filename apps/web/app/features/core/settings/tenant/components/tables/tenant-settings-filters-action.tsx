import { useAuthStore } from '@/stores/auth.store';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { useQuery } from '@tanstack/react-query';
import { TENANTS_KEYS } from '../../../../tenants/keys/tenants-keys';
import { tenantsService } from '../../../../tenants/services/tenants-service';
import type { TenantSettingsFilters } from '../../hooks/use-tenant-settings-filters';

interface TenantSettingsFiltersActionProps {
  filters: TenantSettingsFilters;
  setFilters: (newFilters: Partial<TenantSettingsFilters>) => void;
}

export function TenantSettingsFiltersAction({
  filters,
  setFilters,
}: TenantSettingsFiltersActionProps) {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.isSystemAdmin ?? false;

  const { data: tenantsData } = useQuery({
    queryKey: TENANTS_KEYS.list({}),
    queryFn: () => tenantsService.getAll({ limit: 100 }),
    enabled: isSuperAdmin,
  });

  const tenantOptions =
    tenantsData?.data.map((t) => ({
      value: t.id,
      label: t.name,
    })) ?? [];

  return (
    <div className="flex items-center gap-4 grow">
      <DataTableSearch
        title="Buscar por descripción"
        searchKey="q"
        searchQuery={filters.search || ''}
        setSearchQuery={(q) => setFilters({ search: q })}
        setPage={(p) => setFilters({ page: p })}
      />

      {isSuperAdmin && (
        <DataTableFilterBox
          filterKey="tenantId"
          title="Tenant"
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
