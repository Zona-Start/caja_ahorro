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
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTenantsQuery } from '../../tenants/hooks/use-tenants-queries';
import { useUsersFilters } from '../hooks/use-users-filters';
import { useUsersQuery } from '../hooks/use-users-queries';
import { usersColumns } from './tables/users-columns';
import { UsersHeader } from './users-header';
import { UsersModal } from './users-modal';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'blocked', label: 'Bloqueado' },
];

export default function UsersList() {
  const { user } = useAuthStore();
  const isSystemAdmin = user?.isSystemAdmin ?? false;

  const { filters, setFilters } = useUsersFilters();
  const { data, isLoading } = useUsersQuery(filters);
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
    return <DataTableSkeleton columnCount={6} rowCount={filters.limit} />;
  }

  const usersData = data?.data || [];

  const columns = isSystemAdmin
    ? usersColumns
    : usersColumns.filter((col) => {
        if (col.id === 'tenant') return false;
        if ('accessorKey' in col && col.accessorKey === 'tenantMembers') return false;
        return true;
      });

  return (
    <div className="space-y-4">
      <UsersHeader />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar usuarios..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full sm:w-[250px]"
          />
          <DataTableFilterBox
            filterKey="status"
            title="Estado"
            options={STATUS_OPTIONS}
            setFilterValue={(v) => setFilters({ status: v, page: 1 })}
            filterValue={filters.status || ''}
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
