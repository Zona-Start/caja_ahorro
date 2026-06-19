import { useMemo, useState } from 'react';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Button } from '@repo/shadcn/button';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { TENANTS_KEYS } from '../../../tenants/keys/tenants-keys';
import { tenantsService } from '../../../tenants/services/tenants-service';
import { useModuleSettingsQuery } from '../hooks/use-module-settings-queries';
import { useModuleSettingsFilters } from '../hooks/use-module-settings-filters';
import { createModuleSettingsColumns } from './tables/module-settings-columns';
import { ModuleSettingsModal } from './module-settings-modal';
import { ModuleSettingsHeader } from './module-settings-header';
import { ModuleSettingsFiltersAction, SUBMODULE_LABELS } from './tables/module-settings-filters-action';

export default function ModuleSettingsList() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.isSystemAdmin ?? false;

  const { filters, setFilters } = useModuleSettingsFilters();
  const { data, isLoading } = useModuleSettingsQuery(filters);
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
    () => createModuleSettingsColumns(isSuperAdmin, tenantNames),
    [isSuperAdmin, tenantNames],
  );

  const submoduleOptions = useMemo(() => {
    if (!data?.data) return [];
    const unique = new Set<string>();
    for (const item of data.data) {
      if (item.submodule) unique.add(item.submodule);
    }
    return Array.from(unique)
      .sort()
      .map((value) => ({
        value,
        label: SUBMODULE_LABELS[value] ?? value,
      }));
  }, [data]);

  if (isLoading) {
    return <DataTableSkeleton columnCount={3} rowCount={filters.limit} />;
  }

  const settingsData = data?.data || [];

  return (
    <div className="space-y-4">
      <ModuleSettingsHeader count={data?.total || 0} />

      <div className="flex items-center justify-between">
        <ModuleSettingsFiltersAction
          filters={filters}
          setFilters={setFilters}
          submoduleOptions={submoduleOptions}
        />
        {isSuperAdmin && (
          <Button onClick={() => setOpenModal(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Parámetro
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={settingsData}
        totalItems={data?.total || 0}
        pageSizeOptions={[10, 20, 50]}
      />

      <ModuleSettingsModal
        open={openModal}
        onOpenChange={setOpenModal}
        mode="create"
      />
    </div>
  );
}