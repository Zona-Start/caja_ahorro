import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { InventoryFixedAssetModal } from '../inventory-fixed-assets-modal';
import { useInventoryFixedAssetsFilters } from '../../hooks/use-inventory-fixed-assets-filters';
import {
  FIXED_ASSET_STATUS_OPTIONS,
  DEPRECIATION_METHOD_OPTIONS,
} from '../../schemas/inventory-fixed-assets-options';
import { useCategoriesQuery } from '../../hooks/use-inventory-fixed-assets-queries';

const STATUS_OPTIONS = Object.entries(FIXED_ASSET_STATUS_OPTIONS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

const DEPRECIATION_OPTIONS = Object.entries(DEPRECIATION_METHOD_OPTIONS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export default function InventoryFixedAssetsTableAction() {
  const [open, setOpen] = useState(false);
  const { filters, setFilters } = useInventoryFixedAssetsFilters();
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
          title="Buscar por nombre o código"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={(v) => setFilters({ search: v, page: 1 })}
          setPage={(p) => setFilters({ page: p })}
        />
        <DataTableFilterBox
          filterKey="assetStatus"
          title="Estado"
          options={STATUS_OPTIONS}
          setFilterValue={(v) => setFilters({ assetStatus: v, page: 1 })}
          filterValue={filters.assetStatus || ''}
        />
        <DataTableFilterBox
          filterKey="categoryId"
          title="Categoría"
          options={categoryOptions}
          setFilterValue={(v) => setFilters({ categoryId: v, page: 1 })}
          filterValue={filters.categoryId || ''}
        />
        <DataTableFilterBox
          filterKey="depreciationMethod"
          title="Método Depreciación"
          options={DEPRECIATION_OPTIONS}
          setFilterValue={(v) =>
            setFilters({ depreciationMethod: v, page: 1 })
          }
          filterValue={filters.depreciationMethod || ''}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Activo
      </Button>

      <InventoryFixedAssetModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
