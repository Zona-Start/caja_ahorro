'use client';

import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/components/ui/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { GROUP_TYPE_OPTIONS } from '../../schemas/inventory-category-options';
import InventoryCategoriesModal from '../inventory-categories-modal';
import { useInventoryCategoriesFilters } from './use-inventory-categories-filters';

export function InventoryCategoriesTableAction() {
  const { searchQuery, setPage, setSearchQuery, groupFilter, setGroupFilter } =
    useInventoryCategoriesFilters();
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
        <DataTableFilterBox
          filterKey="group"
          title="Grupo"
          options={GROUP_TYPE_OPTIONS}
          setFilterValue={setGroupFilter}
          filterValue={groupFilter}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Categoría
      </Button>
      <InventoryCategoriesModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
