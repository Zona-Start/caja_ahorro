import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { Input } from '@repo/shadcn/input';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import type { Tenant } from '../../../tenants/schemas/tenants.schema';
import { TENANTS_KEYS } from '../../../tenants/keys/tenants-keys';
import { tenantsService } from '../../../tenants/services/tenants-service';
import { useCategoriesFilters } from '../../hooks/use-categories-filters';
import { CATEGORY_TYPES, TYPE_LABELS } from '../../schemas/categories.schema';
import { CategoriesModal } from '../categories-modal';

const TYPE_OPTIONS = Object.values(CATEGORY_TYPES).map((value) => ({
  value,
  label: TYPE_LABELS[value] || value,
}));

const STATUS_OPTIONS = [
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
];

export default function CategoriesTableAction() {
  const [open, setOpen] = useState(false);
  const { filters, setFilters } = useCategoriesFilters();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.isSystemAdmin ?? false;

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

  const { data: tenantsData } = useQuery({
    queryKey: TENANTS_KEYS.list({}),
    queryFn: () => tenantsService.getAll({ limit: 100 }),
    enabled: isSuperAdmin,
  });

  const tenantOptions = useMemo(
    () =>
      (tenantsData?.data ?? []).map((t: Tenant) => ({
        value: t.id,
        label: t.name,
      })) ?? [],
    [tenantsData],
  );

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 flex-grow">
        <Input
          placeholder="Buscar por código o nombre..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-72 md:max-w-sm"
        />
        <DataTableFilterBox
          filterKey="type"
          title="Tipo de Categoría"
          options={TYPE_OPTIONS}
          setFilterValue={(v) => setFilters({ type: v, page: 1 })}
          filterValue={filters.type || ''}
        />
        <DataTableFilterBox
          filterKey="isActive"
          title="Estado"
          options={STATUS_OPTIONS}
          setFilterValue={(v) => setFilters({ isActive: v, page: 1 })}
          filterValue={filters.isActive || ''}
        />
        {isSuperAdmin && (
          <DataTableFilterBox
            filterKey="tenantId"
            title="Cliente"
            options={tenantOptions}
            setFilterValue={(v) =>
              setFilters({ tenantId: v || undefined, page: 1 })
            }
            filterValue={filters.tenantId || ''}
          />
        )}
      </div>
      {hasPermission('catalog:categories', 'create') && (
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
        </Button>
      )}

      <CategoriesModal open={open} onOpenChange={setOpen} mode="create" />
    </div>
  );
}
