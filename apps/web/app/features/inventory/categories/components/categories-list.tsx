import { useMemo, useState } from 'react';
import { Button } from '@repo/shadcn/button';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { TENANTS_KEYS } from '../../../core/tenants/keys/tenants-keys';
import { tenantsService } from '../../../core/tenants/services/tenants-service';
import { useCategoriesFilters } from '../hooks/use-categories-filters';
import { useCategoriesQuery } from '../hooks/use-categories-queries';
import { CategoriesHeader } from './categories-header';
import { CategoriesModal } from './categories-modal';
import { createCategoriesColumns } from './categories-table/categories-columns';
import { CategoriesFiltersAction } from './categories-table/categories-filters-action';
import { useCategoriesModalStore } from '../store/categories-modal.store';

export default function CategoriesList() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.isSystemAdmin ?? false;

  const { filters } = useCategoriesFilters();
  const { data, isLoading } = useCategoriesQuery(filters);
  const { isOpen, mode, data: modalData, closeModal, openModal } = useCategoriesModalStore();
  const hasPermission = useAuthStore((state) => state.hasPermission);

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
    () => createCategoriesColumns(isSuperAdmin, tenantNames),
    [isSuperAdmin, tenantNames],
  );

  if (isLoading) {
    return <DataTableSkeleton columnCount={4} rowCount={filters.limit} />;
  }

  const categoriesData = data?.data || [];

  return (
    <div className="space-y-4">
      <CategoriesHeader />

      <div className="flex items-center justify-between">
        <CategoriesFiltersAction />
        {hasPermission('inventory:categories', 'create') && (
          <Button onClick={() => openModal('create')} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Agregar Categoría
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={categoriesData}
        totalItems={data?.total || 0}
        pageSizeOptions={[10, 20, 50]}
      />
      <CategoriesModal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        defaultValues={modalData}
        mode={mode}
      />
    </div>
  );
}
