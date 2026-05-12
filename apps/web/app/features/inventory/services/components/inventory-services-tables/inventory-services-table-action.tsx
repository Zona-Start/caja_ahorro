import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { InventoryServiceModal } from '../inventory-services-modal';
import { useInventoryServicesFilters } from '../../hooks/use-inventory-services-filters';
import {
  INVENTORY_SERVICE_STATUS_OPTIONS,
} from '../../schemas/inventory-services-options';
import { useCategoriesQuery } from '../../hooks/use-inventory-services-queries';

const STATUS_OPTIONS = Object.entries(INVENTORY_SERVICE_STATUS_OPTIONS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export default function InventoryServicesTableAction() {
  const [open, setOpen] = useState(false);
  const { filters, setFilters } = useInventoryServicesFilters();
  const { data: categories } = useCategoriesQuery();

  const categoryOptions =
    categories?.map((c) => ({
      value: c.id,
      label: c.name,
    })) ?? [];

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 flex-grow flex-wrap">
        <DataTableSearch
          title="Buscar por nombre"
          searchKey="name"
          searchQuery={filters.search || ''}
          setSearchQuery={(v) => setFilters({ search: v, page: 1 })}
          setPage={(p) => setFilters({ page: p })}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estado"
          options={STATUS_OPTIONS}
          setFilterValue={(v) => setFilters({ status: v, page: 1 })}
          filterValue={filters.status || ''}
        />
        <DataTableFilterBox
          filterKey="categoryId"
          title="Categoría"
          options={categoryOptions}
          setFilterValue={(v) => setFilters({ categoryId: v, page: 1 })}
          filterValue={filters.categoryId || ''}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Servicio
      </Button>

      <InventoryServiceModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
