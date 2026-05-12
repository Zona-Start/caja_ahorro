import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { useMovementsFilters } from '../../hooks/use-movements-filters';
import {
  MOVEMENT_TYPE_OPTIONS,
  ITEM_TYPE_OPTIONS,
} from '../../schemas/movements-options';

const MOVEMENT_TYPE_FILTER_OPTIONS = Object.entries(MOVEMENT_TYPE_OPTIONS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

const ITEM_TYPE_FILTER_OPTIONS = Object.entries(ITEM_TYPE_OPTIONS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export default function MovementsTableAction() {
  const { filters, setFilters } = useMovementsFilters();

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por descripción o documento"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={(v) => setFilters({ search: v })}
          setPage={(p) => setFilters({ page: p })}
        />
        <DataTableFilterBox
          filterKey="movementType"
          title="Tipo de Movimiento"
          options={MOVEMENT_TYPE_FILTER_OPTIONS}
          setFilterValue={(v) => setFilters({ movementType: v })}
          filterValue={filters.movementType || ''}
        />
        <DataTableFilterBox
          filterKey="itemType"
          title="Tipo de Ítem"
          options={ITEM_TYPE_FILTER_OPTIONS}
          setFilterValue={(v) => setFilters({ itemType: v })}
          filterValue={filters.itemType || ''}
        />
      </div>
    </div>
  );
}
