'use client';
import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { useFixedAssetAll } from '../../../fixed-asset/hooks/use-query-fixed-asset'; // New import
import { useProductsAll } from '../../../products/hooks/use-query-product';
import InventoryMovementModal from '../inventory-movement-modal';
import {
  MOVEMENT_TYPE_OPTIONS,
  useInventoryMovementFilters,
} from './use-inventory-movement-filters';

export default function InventoryMovementTableActions() {
  const {
    searchQuery,
    setPage,
    setSearchQuery,
    setItemIdFilter,
    itemIdFilter,
    setItemTypeFilter, // New
    itemTypeFilter, // New
    setMovementTypeFilter,
    movementTypeFilter,
  } = useInventoryMovementFilters();

  const [open, setOpen] = useState(false);

  const { data: dataProducts } = useProductsAll();
  const { data: dataFixedAssets } = useFixedAssetAll(); // New hook call

  const ITEM_TYPE_FILTER_OPTIONS = [
    // New options for itemType filter
    { value: 'PRODUCT', label: 'Producto' },
    { value: 'FIXED_ASSET', label: 'Activo Fijo' },
  ];

  const ITEM_OPTIONS =
    itemTypeFilter === 'PRODUCT'
      ? (dataProducts?.map((item) => ({
          value: item?.id?.toString() ?? '',
          label: item?.name ?? '',
        })) ?? [])
      : itemTypeFilter === 'FIXED_ASSET'
        ? (dataFixedAssets?.map((item: any) => ({
            value: item?.id?.toString() ?? '',
            label: item?.name ?? '',
          })) ?? [])
        : [];

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por nombre item"
          searchKey={searchQuery}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="itemType" // New filter box
          title="Tipo de Item"
          options={ITEM_TYPE_FILTER_OPTIONS}
          setFilterValue={setItemTypeFilter}
          filterValue={itemTypeFilter}
        />
        <DataTableFilterBox
          filterKey="itemId"
          title="Item"
          options={ITEM_OPTIONS}
          setFilterValue={setItemIdFilter}
          filterValue={itemIdFilter}
        />
        <DataTableFilterBox
          filterKey="movementType"
          title="Tipo de Movimiento"
          options={MOVEMENT_TYPE_OPTIONS}
          setFilterValue={setMovementTypeFilter}
          filterValue={movementTypeFilter}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Nuevo Movimiento
      </Button>
      <InventoryMovementModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
