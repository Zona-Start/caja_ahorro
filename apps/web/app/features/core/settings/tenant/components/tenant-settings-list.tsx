import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useTenantSettingsQuery } from '../hooks/use-tenant-settings-queries';
import { tenantSettingsColumns } from './tables/tenant-settings-columns';
import { TenantSettingsHeader } from './tenant-settings-header';

export default function TenantSettingsList() {
  const { data, isLoading } = useTenantSettingsQuery();

  if (isLoading) {
    return <DataTableSkeleton columnCount={3} rowCount={10} />;
  }

  const settingsData = data || [];

  return (
    <div className="space-y-4">
      <TenantSettingsHeader count={settingsData.length} />

      <DataTable
        columns={tenantSettingsColumns}
        data={settingsData}
        totalItems={settingsData.length}
        pageSizeOptions={[10, 20, 50]}
      />
    </div>
  );
}