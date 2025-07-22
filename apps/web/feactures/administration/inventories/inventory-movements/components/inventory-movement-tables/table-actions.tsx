'use client';
import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { useProductsAll } from '../../products/hooks/use-query-product';
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
    setProductIdFilter,
    productIdFilter,
    setMovementTypeFilter,
    movementTypeFilter,
    setDocumentTypeFilter,
    documentTypeFilter,
    setDocumentNumberFilter,
    documentNumberFilter,
  } = useInventoryMovementFilters();

  const [open, setOpen] = useState(false);

  const { data: dataProducts } = useProductsAll();
  const PRODUCT_OPTIONS =
    dataProducts?.map((product) => ({
      value: product?.id?.toString() ?? '',
      label: product?.name ?? '',
    })) ?? [];

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por notas"
          searchKey={searchQuery}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="productId"
          title="Producto"
          options={PRODUCT_OPTIONS}
          setFilterValue={setProductIdFilter}
          filterValue={productIdFilter}
        />
        <DataTableFilterBox
          filterKey="movementType"
          title="Tipo de Movimiento"
          options={MOVEMENT_TYPE_OPTIONS}
          setFilterValue={setMovementTypeFilter}
          filterValue={movementTypeFilter}
        />
        <DataTableFilterBox
          filterKey="documentType"
          title="Tipo de Documento"
          options={[]}
          setFilterValue={setDocumentTypeFilter}
          filterValue={documentTypeFilter}
        />
        <DataTableFilterBox
          filterKey="documentNumber"
          title="Número de Documento"
          options={[]}
          setFilterValue={setDocumentNumberFilter}
          filterValue={documentNumberFilter}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Nuevo Movimiento
      </Button>
      <InventoryMovementModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
