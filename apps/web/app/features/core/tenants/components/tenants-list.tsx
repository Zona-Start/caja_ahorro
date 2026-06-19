import { Button } from '@repo/shadcn/button';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Plus } from 'lucide-react';
import { useTenantsFilters } from '../hooks/use-tenants-filters';
import {
  useTenantActiveCountQuery,
  useTenantsQuery,
} from '../hooks/use-tenants-queries';
import { useTenantsModalStore } from '../store/tenants-modal-store';
import { tenantsColumns } from './tenants-table/tenants-columns';
import { TenantsFiltersAction } from './tenants-table/tenants-filters-action';
import { TenantsHeader } from './tenants-header';
import { TenantsModal } from './tenants-modal';
import { TenantsDetailModal } from './tenants-detail-modal';

export default function TenantsList() {
  const { filters, setFilters } = useTenantsFilters();
  const { data, isLoading } = useTenantsQuery(filters);
  const { data: count } = useTenantActiveCountQuery();
  const { openModal } = useTenantsModalStore();

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={filters.limit} />;
  }

  const tenantsData = data?.data || [];

  return (
    <div className="space-y-4">
      <TenantsHeader />

      <div className="flex items-center justify-between">
        <TenantsFiltersAction
          filters={filters}
          setFilters={setFilters}
        />
        <Button onClick={() => openModal('create')} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <DataTable
        columns={tenantsColumns}
        data={tenantsData}
        totalItems={data?.meta?.totalItems || 0}
        pageSizeOptions={[10, 20, 30, 50]}
      />

      <TenantsModal />
      <TenantsDetailModal />
    </div>
  );
}
