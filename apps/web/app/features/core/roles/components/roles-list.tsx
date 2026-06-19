import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@repo/shadcn/button';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTenantsQuery } from '../../tenants/hooks/use-tenants-queries';
import { useRolesFilters } from '../hooks/use-roles-filters';
import { useRolesQuery } from '../hooks/use-roles-queries';
import { RolesFiltersAction } from './tables/roles-filters-action';
import { RolesHeader } from './roles-header';
import { RolesModal } from './roles-modal';
import { rolesColumns } from './tables/roles-columns';

export default function RolesList() {
  const { user } = useAuthStore();
  const isSystemAdmin = user?.isSystemAdmin ?? false;

  const { filters, setFilters } = useRolesFilters();
  const { data, isLoading } = useRolesQuery(filters);
  const [openModal, setOpenModal] = useState(false);

  const { data: tenantsData } = useTenantsQuery(
    { page: 1, limit: 100, isActive: 'true', search: '' },
    isSystemAdmin,
  );

  const tenantsMap = useMemo(
    () => new Map(tenantsData?.data?.map((t) => [t.id, t.name]) || []),
    [tenantsData],
  );

  if (isLoading) {
    return <DataTableSkeleton columnCount={5} rowCount={filters.limit} />;
  }

  const rolesData =
    data?.data?.map((role) => ({
      ...role,
      tenant: role.tenant
        ? {
            ...role.tenant,
            name:
              role.tenant.name ||
              tenantsMap.get(role.tenantId) ||
              role.tenantId,
          }
        : {
            id: role.tenantId,
            name: tenantsMap.get(role.tenantId) || role.tenantId,
          },
    })) || [];

  const columns = isSystemAdmin
    ? rolesColumns
    : rolesColumns.filter((col) => col.id !== 'tenant');

  return (
    <div className="space-y-4">
      <RolesHeader />

      <div className="flex items-center justify-between">
        <RolesFiltersAction filters={filters} setFilters={setFilters} />
        <Button onClick={() => setOpenModal(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Rol
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={rolesData}
        totalItems={data?.total || 0}
        pageSizeOptions={[10, 20, 30, 50]}
      />

      <RolesModal open={openModal} onOpenChange={setOpenModal} mode="create" />
    </div>
  );
}
