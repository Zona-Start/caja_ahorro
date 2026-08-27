import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { InventoryServiceModal } from '../inventory-services-modal';
import { useInventoryServicesFilters } from '../../hooks/use-inventory-services-filters';
import { INVENTORY_SERVICE_STATUS_OPTIONS } from '../../schemas/inventory-services-options';
import { useCategoriesQuery } from '../../hooks/use-inventory-services-queries';
import { useAuthStore } from '@/stores/auth.store';

const STATUS_OPTIONS = Object.entries(INVENTORY_SERVICE_STATUS_OPTIONS).map(([value, label]) => ({ value, label }));

export default function InventoryServicesTableAction() {
  const [open, setOpen] = useState(false);
  const { search, setSearch, filters, setFilters } = useInventoryServicesFilters();
  const { data: categories } = useCategoriesQuery();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 md:max-w-sm"
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estado"
          options={STATUS_OPTIONS}
          setFilterValue={(v: any) => setFilters({ status: v ?? '', page: 1 }) as any}
          filterValue={filters.status || ''}
        />
        <DataTableFilterBox
          filterKey="categoryId"
          title="Categoría"
          options={categories?.map((c) => ({ value: c.id, label: c.name })) ?? []}
          setFilterValue={(v: any) => setFilters({ categoryId: v ?? '', page: 1 }) as any}
          filterValue={filters.categoryId || ''}
        />
      </div>

      {hasPermission('inventory:services', 'create') && (
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Agregar Servicio
        </Button>
      )}

      <InventoryServiceModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
