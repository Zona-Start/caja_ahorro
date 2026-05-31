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
import { useEffect, useRef, useState } from 'react';
import { useTenantsQuery } from '../../tenants/hooks/use-tenants-queries';
import { useRolesFilters } from '../hooks/use-roles-filters';
import { useRolesQuery } from '../hooks/use-roles-queries';
import { RolesHeader } from './roles-header';
import { RolesModal } from './roles-modal';
import { rolesColumns } from './tables/roles-columns';

export default function RolesList() {
  const { user } = useAuthStore();
  const isSystemAdmin = user?.isSystemAdmin ?? false;

  const { filters, setFilters } = useRolesFilters();
  const { data, isLoading } = useRolesQuery(filters);
  const [openModal, setOpenModal] = useState(false);

  const [searchValue, setSearchValue] = useState(filters.search || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ search: value || undefined, page: 1 });
    }, 400);
  };

  const { data: tenantsData } = useTenantsQuery(
    { page: 1, limit: 100, isActive: 'true' },
    isSystemAdmin,
  );

  if (isLoading) {
    return <DataTableSkeleton columnCount={5} rowCount={filters.limit} />;
  }

  const tenantsMap = new Map(
    tenantsData?.data?.map((t) => [t.id, t.name]) || [],
  );

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

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar roles..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full sm:w-[250px]"
          />
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
