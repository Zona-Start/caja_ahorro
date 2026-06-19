import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useProductsFilters } from '../../hooks/use-products-filters';
import { STATUS_TYPES } from '../../schemas/products-options';
import { useProductsModalStore } from '../../store/products-modal.store';
import { useCategoriesQuery } from '../../hooks/use-products-queries';

export function ProductsTableAction() {
  const { search, setSearch, setPage, status, setStatus, categoryId, setCategoryId } =
    useProductsFilters();
  const { data: categories } = useCategoriesQuery();
  const { openModal } = useProductsModalStore();

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-4 flex-wrap">
        <DataTableSearch
          title="Buscar por nombre"
          searchKey="name"
          searchQuery={search}
          setSearchQuery={setSearch}
          setPage={setPage}
        />

        <DataTableFilterBox
          filterKey="status"
          title="Estado"
          options={STATUS_TYPES.map((s) => ({ value: s.value, label: s.label }))}
          setFilterValue={setStatus}
          filterValue={status}
        />

        <DataTableFilterBox
          filterKey="categoryId"
          title="Categoría"
          options={
            categories?.map((c) => ({ value: c.id, label: c.name })) ?? []
          }
          setFilterValue={setCategoryId}
          filterValue={categoryId}
        />
      </div>

      <Button onClick={() => openModal('create')} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Producto
      </Button>
    </div>
  );
}
