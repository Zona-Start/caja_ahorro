import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { getStatesAction } from '../../../../core/states/services/querys-states';
import { TENANTS_KEYS } from '../../../../core/tenants/keys/tenants-keys';
import { tenantsService } from '../../../../core/tenants/services/tenants-service';
import type { Tenant } from '../../../../core/tenants/schemas/tenants.schema';
import { useSuppliersFilters } from '../../hooks/use-suppliers-filters';
import { CATEGORY_OPTIONS } from '../../schemas/suppliers-options';

export function SuppliersFiltersAction() {
  const { filters, setFilters } = useSuppliersFilters();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.isSystemAdmin ?? false;

  const { data: tenantsData } = useQuery({
    queryKey: TENANTS_KEYS.list({}),
    queryFn: () => tenantsService.getAll({ limit: 100 }),
    enabled: isSuperAdmin,
  });

  const { data: statesData } = useQuery({
    queryKey: QUERY_KEYS.states.list({}),
    queryFn: () => getStatesAction(),
  });

  const stateOptions = useMemo(
    () =>
      (statesData ?? []).map((s: { id?: number; name: string }) => ({
        value: String(s.id ?? ''),
        label: s.name,
      })),
    [statesData],
  );

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
        filterKey="category"
        title="Categoría"
        options={CATEGORY_OPTIONS.map((opt) => ({
          value: opt.value,
          label: opt.label,
        }))}
        filterValue={filters.category || ''}
        setFilterValue={(v) =>
          setFilters({ category: v || undefined, page: 1 })
        }
      />

      <DataTableFilterBox
        filterKey="state"
        title="Localidad"
        options={stateOptions}
        filterValue={filters.state || ''}
        setFilterValue={(v) =>
          setFilters({ state: v || undefined, page: 1 })
        }
      />

      {isSuperAdmin && (
        <DataTableFilterBox
          filterKey="tenantId"
          title="Empresa"
          options={tenantOptions}
          filterValue={filters.tenantId || ''}
          setFilterValue={(v) =>
            setFilters({ tenantId: v || undefined, page: 1 })
          }
        />
      )}
    </div>
  );
}
