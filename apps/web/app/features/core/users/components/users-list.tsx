import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@repo/shadcn/button';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useUsersFilters } from '../hooks/use-users-filters';
import { useUsersQuery } from '../hooks/use-users-queries';
import { usersColumns } from './tables/users-columns';
import { UsersFiltersAction } from './tables/users-filters-action';
import { UsersHeader } from './users-header';
import { UsersModal } from './users-modal';

export default function UsersList() {
  const { user } = useAuthStore();
  const isSystemAdmin = user?.isSystemAdmin ?? false;

  const { filters, setFilters } = useUsersFilters();
  const { data, isLoading } = useUsersQuery(filters);
  const [openModal, setOpenModal] = useState(false);

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
        <UsersFiltersAction filters={filters} setFilters={setFilters} />

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
