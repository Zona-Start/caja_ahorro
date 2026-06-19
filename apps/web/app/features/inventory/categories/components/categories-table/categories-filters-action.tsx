import { useAuthStore } from '@/stores/auth.store';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { useQuery } from '@tanstack/react-query';
import { TENANTS_KEYS } from '../../../../core/tenants/keys/tenants-keys';
import { tenantsService } from '../../../../core/tenants/services/tenants-service';
import type { Tenant } from '../../../../core/tenants/schemas/tenants.schema';
import { useCategoriesFilters } from '../../hooks/use-categories-filters';
import { GROUP_TYPE_OPTIONS } from '../../schemas/categories-options';

export function CategoriesFiltersAction() {
  const { filters, setFilters } = useCategoriesFilters();
  const { user } = useAuthStore();
  const isSystemAdmin = user?.isSystemAdmin ?? false;

  const { data: tenantsData } = useQuery({
    queryKey: TENANTS_KEYS.list({}),
    queryFn: () => tenantsService.getAll({ limit: 100 }),
    enabled: isSystemAdmin,
  });

  const tenantOptions =
    tenantsData?.data.map((t: Tenant) => ({
      value: t.id,
      label: t.name,
    })) ?? [];

  return (
    <div className="flex items-center gap-4 grow">
      <DataTableSearch
        title="Buscar por nombre"
        searchKey="search"
        searchQuery={filters.search || ''}
        setSearchQuery={(q) => setFilters({ search: q })}
        setPage={(p) => setFilters({ page: p })}
      />

      <DataTableFilterBox
        filterKey="group"
        title="Grupo"
        options={GROUP_TYPE_OPTIONS.map((opt) => ({
          value: opt.value,
          label: opt.label,
        }))}
        filterValue={filters.group || ''}
        setFilterValue={(v) =>
          setFilters({ group: v || undefined, page: 1 })
        }
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
