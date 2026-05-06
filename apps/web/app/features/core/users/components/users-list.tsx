import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTenantsQuery } from '../../tenants/hooks/use-tenants-queries';
import { useUsersFilters } from '../hooks/use-users-filters';
import { useUsersQuery } from '../hooks/use-users-queries';
import { usersColumns } from './tables/users-columns';
import { UsersHeader } from './users-header';
import { UsersModal } from './users-modal';

export default function UsersList() {
  const { user } = useAuthStore();
  const isSystemAdmin = user?.isSystemAdmin ?? false;

  const { filters, setFilters, clearFilters } = useUsersFilters();
  const { data, isLoading } = useUsersQuery(filters);
  const [openModal, setOpenModal] = useState(false);

  const { data: tenantsData } = useTenantsQuery(
    { page: 1, limit: 100, isActive: 'true' },
    isSystemAdmin,
  );

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={filters.limit} />;
  }

  const usersData = data?.data || [];

  const columns = isSystemAdmin
    ? usersColumns
    : usersColumns.filter(
        (col) =>
          col.id !== 'tenant' && (col as any).accessorKey !== 'tenantMembers',
      );

  return (
    <div className="space-y-4">
      <UsersHeader />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar usuarios..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ search: e.target.value, page: 1 })}
            className="w-full sm:w-[250px]"
          />
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              setFilters({
                status: value === 'all' ? undefined : value,
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
              <SelectItem value="blocked">Bloqueado</SelectItem>
            </SelectContent>
          </Select>
          {isSystemAdmin && (
            <Select
              value={filters.tenantId || 'all'}
              onValueChange={(value) =>
                setFilters({
                  tenantId: value === 'all' ? undefined : value,
                  page: 1,
                })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Tenants</SelectItem>
                {tenantsData?.data?.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button onClick={() => setOpenModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={usersData}
        totalItems={data?.total || 0}
        pageSizeOptions={[10, 20, 30, 50]}
      />

      <UsersModal open={openModal} onOpenChange={setOpenModal} mode="create" />
    </div>
  );
}
