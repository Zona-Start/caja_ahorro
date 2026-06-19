import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import type { PermissionsFilters } from '../../hooks/use-permissions-filters';
import {
  RESOURCE_OPTIONS,
  SCOPE_OPTIONS,
} from '../../schemas/permission.option';

interface PermissionsFiltersActionProps {
  filters: PermissionsFilters;
  setFilters: (newFilters: Partial<PermissionsFilters>) => void;
}

export function PermissionsFiltersAction({
  filters,
  setFilters,
}: PermissionsFiltersActionProps) {
  const { search, resource, scope } = filters;

  return (
    <div className="flex items-center gap-4 grow">
      <DataTableSearch
        title="Buscar por nombre"
        searchKey="q"
        searchQuery={search || ''}
        setSearchQuery={(q) => setFilters({ search: q })}
        setPage={(p) => setFilters({ page: p })}
      />
      <DataTableFilterBox
        filterKey="resource"
        title="Recurso"
        options={RESOURCE_OPTIONS}
        setFilterValue={(v) => setFilters({ resource: v })}
        filterValue={resource || ''}
      />
      <DataTableFilterBox
        filterKey="scope"
        title="Alcance"
        options={SCOPE_OPTIONS}
        setFilterValue={(v) => setFilters({ scope: v })}
        filterValue={scope || ''}
      />
    </div>
  );
}
