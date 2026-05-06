import { useState } from 'react';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { Plus } from 'lucide-react';
import { useModuleSettingsQuery } from '../hooks/use-module-settings-queries';
import { useModuleSettingsFilters } from '../hooks/use-module-settings-filters';
import { moduleSettingsColumns } from './tables/module-settings-columns';
import { ModuleSettingsModal } from './module-settings-modal';
import { ModuleSettingsHeader } from './module-settings-header';

export default function ModuleSettingsList() {
  const { filters, setFilters } = useModuleSettingsFilters();
  const { data, isLoading } = useModuleSettingsQuery(filters);
  const [openModal, setOpenModal] = useState(false);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={filters.limit} />;
  }

  const settingsData = data?.data || [];

  return (
    <div className="space-y-4">
      <ModuleSettingsHeader count={data?.total || 0} />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Input
          placeholder="Buscar parámetros..."
          value={filters.search || ''}
          onChange={(e) => setFilters({ search: e.target.value, page: 1 })}
          className="w-full sm:w-[250px]"
        />

        <Button onClick={() => setOpenModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Parámetro
        </Button>
      </div>

      <DataTable
        columns={moduleSettingsColumns}
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