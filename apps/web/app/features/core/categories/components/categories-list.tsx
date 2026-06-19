import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useAuthStore } from '@/stores/auth.store';
import { TENANTS_KEYS } from '../../tenants/keys/tenants-keys';
import { tenantsService } from '../../tenants/services/tenants-service';
import type { Tenant } from '../../tenants/schemas/tenants.schema';
import { useCategoriesFilters } from '../hooks/use-categories-filters';
import { useCategoriesQuery } from '../hooks/use-categories-queries';
import { createCategoriesColumns } from './tables/columns';
import { CategoriesHeader } from './categories-header';
import CategoriesTableAction from './tables/categories-table-action';

export default function CategoriesList() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.isSystemAdmin ?? false;

  const { filters } = useCategoriesFilters();
  const { data, isLoading } = useCategoriesQuery(filters);

  const { data: tenantsData } = useQuery({
    queryKey: TENANTS_KEYS.list({}),
    queryFn: () => tenantsService.getAll({ limit: 100 }),
    enabled: isSuperAdmin,
  });

  const tenantNames = useMemo(() => {
    if (!tenantsData?.data) return {};
    const map: Record<string, string> = {};
    for (const t of tenantsData.data as Tenant[]) {
      map[t.id] = t.name;
    }
    return map;
  }, [tenantsData]);

  const columns = useMemo(
    () => createCategoriesColumns(isSuperAdmin, tenantNames),
    [isSuperAdmin, tenantNames],
  );

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={filters.limit} />;
  }

  const categoriesData = data?.data || [];

  return (
    <div className="space-y-4">
      <CategoriesHeader />

      <CategoriesTableAction />

      <DataTable
        columns={columns}
        data={categoriesData}
        totalItems={data?.total || 0}
        pageSizeOptions={[10, 20, 30, 50]}
      />
    </div>
  );
}
