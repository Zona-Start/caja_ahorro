'use client';
import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { useInventoryCategoriesAll } from '../../../inventory-categories/hooks/use-query-inventory-categories';
import ProductModal from '../product-modal';
import {
  PRODUCT_STATUS_OPTIONS,
  useProductFilters,
} from './use-product-filters';

export default function ProductTableActions() {
  const {
    searchQuery,
    setPage,
    setSearchQuery,
    setCategoryTypeFilter,
    typeCategoryFilter,
    setStatusFilter,
    statusFilter,
  } = useProductFilters();

  const [open, setOpen] = useState(false);

  const { data: dataTypeCategory } = useInventoryCategoriesAll('PRODUCT');
  const TYPE_CATEGORY_OPTIONS =
    dataTypeCategory?.map((type) => ({
      value: type?.id?.toString() ?? '',
      label: type?.name ?? '',
    })) ?? [];

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por nombre"
          searchKey={searchQuery}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="type"
          title="Tipo de Categoría"
          options={TYPE_CATEGORY_OPTIONS}
          setFilterValue={setCategoryTypeFilter}
          filterValue={typeCategoryFilter}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estatus"
          options={PRODUCT_STATUS_OPTIONS}
          setFilterValue={setStatusFilter}
          filterValue={statusFilter}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
      </Button>
      <ProductModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
