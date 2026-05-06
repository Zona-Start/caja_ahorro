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
import { useTenantsFilters } from '../hooks/use-tenants-filters';
import {
  useTenantActiveCountQuery,
  useTenantsQuery,
} from '../hooks/use-tenants-queries';
import { tenantsColumns } from './tables/tenants-columns';
import { TenantsHeader } from './tenants-header';
import { TenantsModal } from './tenants-modal';

export default function TenantsList() {
  const { filters, setFilters, clearFilters } = useTenantsFilters();
  const { data, isLoading } = useTenantsQuery(filters);
  const { data: count } = useTenantActiveCountQuery();
  const [openModal, setOpenModal] = useState(false);

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={filters.limit} />;
  }

  const tenantsData = data?.data || [];

  return (
    <div className="space-y-4">
      <TenantsHeader />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar tenants..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ search: e.target.value, page: 1 })}
            className="w-full sm:w-[250px]"
          />
          <Select
            value={filters.isActive}
            onValueChange={(value) =>
              setFilters({
                isActive: value as 'all' | 'true' | 'false',
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setOpenModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Tenant
        </Button>
      </div>

      <DataTable
        columns={tenantsColumns}
        data={tenantsData}
        totalItems={data?.meta?.totalItems || 0}
        pageSizeOptions={[10, 20, 30, 50]}
      />

      <TenantsModal
        open={openModal}
        onOpenChange={setOpenModal}
        mode="create"
      />
    </div>
  );
}
