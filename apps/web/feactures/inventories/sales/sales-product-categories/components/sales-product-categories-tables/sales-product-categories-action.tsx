'use client';

import { Button } from '@repo/shadcn/button';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import SalesProductCategoriesModal from '../sales-product-categories-modal';
import { useSaleProductCategoriesFilters } from './use-sale-product-categories-filters';

export function SalesProductCategoriesTableAction() {
  const { searchQuery, setPage, setSearchQuery } =
    useSaleProductCategoriesFilters();
  const [open, setOpen] = useState(false);

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
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Tipo
      </Button>
      <SalesProductCategoriesModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
