import { Button } from '@repo/shadcn/button';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { Plus } from 'lucide-react';
import { useCategoriesFilters } from '../../hooks/use-categories-filters';
import { useCategoriesModalStore } from '../../store/categories-modal.store';
import { GROUP_TYPE_OPTIONS } from '../../schemas/categories-options';

export function CategoriesTableAction() {
  const { filters, setFilters } = useCategoriesFilters();
  const { openModal } = useCategoriesModalStore();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 grow">
        <DataTableSearch
          title="Buscar por nombre"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={(v) => setFilters({ search: typeof v === 'string' ? v : '' })}
          setPage={(p) => setFilters({ page: typeof p === 'number' ? p : 1 })}
        />
        <DataTableFilterBox
          filterKey="group"
          title="Grupo"
          options={GROUP_TYPE_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          filterValue={filters.group || ''}
          setFilterValue={(v) =>
            setFilters({ group: typeof v === 'string' ? v : '' })
          }
        />
      </div>
      <Button onClick={() => openModal('create')} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Categoría
      </Button>
    </div>
  );
}
