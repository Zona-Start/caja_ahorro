import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePermissionsFilters } from '../hooks/use-permissions-filters';
import { usePermissionsQuery } from '../hooks/use-permissions-queries';
import { PermissionsHeader } from './permissions-header';
import { PermissionsModal } from './permissions-modal';
import { permissionsColumns } from './tables/permissions-columns';

export default function PermissionsList() {
  const { filters, setFilters } = usePermissionsFilters();
  const { data, isLoading } = usePermissionsQuery(filters);
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

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={filters.limit} />;
  }

  const permissionsData = data?.data || [];

  return (
    <div className="space-y-4">
      <PermissionsHeader />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Input
          placeholder="Buscar permisos..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full sm:w-[250px]"
        />

        <Button onClick={() => setOpenModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Permiso
        </Button>
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
