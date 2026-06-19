import { Button } from '@repo/shadcn/button';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { usePermissionsFilters } from '../hooks/use-permissions-filters';
import { usePermissionsQuery } from '../hooks/use-permissions-queries';
import { PermissionsHeader } from './permissions-header';
import { PermissionsModal } from './permissions-modal';
import { PermissionsFiltersAction } from './tables/permissions-filters-action';
import { permissionsColumns } from './tables/permissions-columns';

export default function PermissionsList() {
  const { filters, setFilters } = usePermissionsFilters();
  const { data, isLoading } = usePermissionsQuery(filters);
  const [openModal, setOpenModal] = useState(false);

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={filters.limit} />;
  }

  const permissionsData = data?.data || [];

  return (
    <div className="space-y-4">
      <PermissionsHeader />

      <div className="flex items-center justify-between mt-4">
        <PermissionsFiltersAction
          filters={filters}
          setFilters={setFilters}
        />
        <div className="flex gap-2">
          <Button onClick={() => setOpenModal(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Permiso
          </Button>
        </div>
      </div>

      <DataTable
        columns={permissionsColumns}
        data={permissionsData}
        totalItems={data?.total || 0}
        pageSizeOptions={[10, 20, 50]}
      />

      <PermissionsModal
        open={openModal}
        onOpenChange={setOpenModal}
        mode="create"
      />
    </div>
  );
}
