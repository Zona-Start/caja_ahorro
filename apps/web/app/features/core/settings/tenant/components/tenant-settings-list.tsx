import { useAuthStore } from '@/stores/auth.store';
import { TENANTS_KEYS } from '@/features/core/tenants/keys/tenants-keys';
import { tenantsService } from '@/features/core/tenants/services/tenants-service';
import { Button } from '@repo/shadcn/button';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTenantSettingsFilters } from '../hooks/use-tenant-settings-filters';
import { useTenantSettingsQuery } from '../hooks/use-tenant-settings-queries';
import { TenantSettingsHeader } from './tenant-settings-header';
import { TenantSettingsModal } from './tenant-settings-modal';
import { TenantSettingsFiltersAction } from './tables/tenant-settings-filters-action';
import { createTenantSettingsColumns } from './tables/tenant-settings-columns';

export default function TenantSettingsList() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.isSystemAdmin ?? false;

  const { filters, setFilters } = useTenantSettingsFilters();
  const { data, isLoading } = useTenantSettingsQuery(filters);
  const [openModal, setOpenModal] = useState(false);

  const { data: tenantsData } = useQuery({
    queryKey: TENANTS_KEYS.list({}),
    queryFn: () => tenantsService.getAll({ limit: 100 }),
    enabled: isSuperAdmin,
  });

  const tenantNames = useMemo(() => {
    if (!tenantsData?.data) return {};
    const map: Record<string, string> = {};
    for (const t of tenantsData.data) {
      map[t.id] = t.name;
    }
    return map;
  }, [tenantsData]);

  const columns = useMemo(
    () => createTenantSettingsColumns(isSuperAdmin, tenantNames),
    [isSuperAdmin, tenantNames],
  );

  if (isLoading) {
    return <DataTableSkeleton columnCount={4} rowCount={filters.limit} />;
  }

  const settingsData = data?.data ?? [];
  const totalItems = data?.meta?.totalItems ?? 0;

  return (
    <div className="space-y-4">
      <TenantSettingsHeader count={totalItems} />

      <div className="flex items-center justify-between mt-4">
        <TenantSettingsFiltersAction
          filters={filters}
          setFilters={setFilters}
        />
        <div className="flex gap-2">
          {isSuperAdmin && (
            <Button onClick={() => setOpenModal(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Parámetro
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={settingsData}
        totalItems={totalItems}
        pageSizeOptions={[10, 20, 50]}
      />

      <TenantSettingsModal
        open={openModal}
        onOpenChange={setOpenModal}
        mode="create"
      />
    </div>
  );
}
