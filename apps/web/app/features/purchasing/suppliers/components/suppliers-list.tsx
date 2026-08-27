import { useMemo } from 'react';
import { Button } from '@repo/shadcn/button';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { TENANTS_KEYS } from '../../../core/tenants/keys/tenants-keys';
import { tenantsService } from '../../../core/tenants/services/tenants-service';
import { useSuppliersFilters } from '../hooks/use-suppliers-filters';
import { useSuppliersQuery } from '../hooks/use-suppliers-queries';
import { useSuppliersModalStore } from '../store/suppliers-modal.store';
import { createSuppliersColumns } from './suppliers-table/suppliers-columns';
import { SuppliersFiltersAction } from './suppliers-table/suppliers-filters-action';
import { SuppliersHeader } from './suppliers-header';
import { SuppliersModal } from './suppliers-modal';

export default function SuppliersList() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.isSystemAdmin ?? false;
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const { filters } = useSuppliersFilters();
  const { data, isLoading } = useSuppliersQuery(filters);
  const { openModal } = useSuppliersModalStore();

  const { data: tenantsData } = useQuery({
    queryKey: TENANTS_KEYS.list({}),
    queryFn: () => tenantsService.getAll({ limit: 100 }),
    enabled: isSuperAdmin,
  });

  const tenantNames = useMemo(() => {
    if (!tenantsData?.data) return {};
    const map: Record<string, string> = {};
    for (const t of tenantsData.data) {
      map[t.id] = t.name;
    }
    return map;
  }, [tenantsData]);

  const columns = useMemo(
    () => createSuppliersColumns(isSuperAdmin, tenantNames),
    [isSuperAdmin, tenantNames],
  );

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={filters.limit} />;
  }

  const suppliersData = data?.data || [];

  return (
    <div className="space-y-4">
      <SuppliersHeader />

      <div className="flex items-center justify-between">
        <SuppliersFiltersAction />
        {hasPermission('purchasing:suppliers', 'create') && (
          <Button onClick={() => openModal('create')} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Proveedor
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={suppliersData}
        totalItems={data?.meta?.totalItems || 0}
        pageSizeOptions={[10, 20, 30, 50]}
      />

      <SuppliersModal />
    </div>
  );
}
