'use client';
import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { useSalesProductCategoriesAll } from '../../../sales-product-categories/hooks/use-query-sales-product-categories';
import SalesProductModal from '../sales-product-modal';
import {
  ESTATUS_OPTIONS,
  useSaleProductFilters,
} from './use-sale-product-filters';

export default function SalesProductTableActions() {
  const {
    searchQuery,
    setPage,
    setSearchQuery,
    setCategoryTypeFilter,
    typeCategoryFilter,
    setStatusFilter,
    statusFilter,
  } = useSaleProductFilters();

  const [open, setOpen] = useState(false);

  const { data: dataTypeCategory } = useSalesProductCategoriesAll();
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
          options={ESTATUS_OPTIONS}
          setFilterValue={setStatusFilter}
          filterValue={statusFilter}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
      </Button>
      <SalesProductModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
