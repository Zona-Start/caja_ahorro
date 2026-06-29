import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { Input } from '@repo/shadcn/input';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { InventoryFixedAssetModal } from '../inventory-fixed-assets-modal';
import { useInventoryFixedAssetsFilters } from '../../hooks/use-inventory-fixed-assets-filters';
import {
  FIXED_ASSET_STATUS_OPTIONS,
  DEPRECIATION_METHOD_OPTIONS,
} from '../../schemas/inventory-fixed-assets-options';
import { useCategoriesByGroupQuery } from '../../hooks/use-inventory-fixed-assets-queries';
import { useInventoryFixedAssetsModalStore } from '../../store/inventory-fixed-assets-modal.store';

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
  const { filters, setFilters } = useInventoryFixedAssetsFilters();
  const { data: categories } = useCategoriesByGroupQuery('FIXED_ASSETS');
  const { openModal } = useInventoryFixedAssetsModalStore();

  const [searchValue, setSearchValue] = useState(filters.search ?? '');

  const categoryOptions =
    categories?.map((c) => ({
      value: c.id,
      label: c.name,
    })) ?? [];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== (filters.search ?? '')) {
        setFilters({ search: searchValue || '', page: 1 });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    setSearchValue(filters.search ?? '');
  }, [filters.search]);

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 flex-grow flex-wrap">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código o serie..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
        <DataTableFilterBox
          filterKey="assetStatus"
          title="Estado"
          options={STATUS_OPTIONS}
          setFilterValue={(v) => setFilters({ assetStatus: v, page: 1 })}
          filterValue={filters.assetStatus ?? ''}
        />
        <DataTableFilterBox
          filterKey="categoryId"
          title="Categoría"
          options={categoryOptions}
          setFilterValue={(v) => setFilters({ categoryId: v, page: 1 })}
          filterValue={filters.categoryId ?? ''}
        />
        <DataTableFilterBox
          filterKey="depreciationMethod"
          title="Método Depreciación"
          options={DEPRECIATION_OPTIONS}
          setFilterValue={(v) =>
            setFilters({ depreciationMethod: v, page: 1 })
          }
          filterValue={filters.depreciationMethod ?? ''}
        />
      </div>
      <Button onClick={() => openModal('create')} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Activo
      </Button>

      <InventoryFixedAssetModal />
    </div>
  );
}
