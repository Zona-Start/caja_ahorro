import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { Input } from '@repo/shadcn/input';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useCategoriesFilters } from '../../hooks/use-categories-filters';
import { CATEGORY_TYPES, TYPE_LABELS } from '../../schemas/categories.schema';
import { CategoriesModal } from '../categories-modal';

const TYPE_OPTIONS = Object.values(CATEGORY_TYPES).map((value) => ({
  value,
  label: TYPE_LABELS[value] || value,
}));

const STATUS_OPTIONS = [
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
];

export default function CategoriesTableAction() {
  const [open, setOpen] = useState(false);
  const { filters, setFilters } = useCategoriesFilters();

  const [searchValue, setSearchValue] = useState(filters.search || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ search: value || undefined, page: 1 });
    }, 400);
  };

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 flex-grow">
        <Input
          placeholder="Buscar por código o nombre..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-72 md:max-w-sm"
        />
        <DataTableFilterBox
          filterKey="type"
          title="Tipo de Categoría"
          options={TYPE_OPTIONS}
          setFilterValue={(v) => setFilters({ type: v, page: 1 })}
          filterValue={filters.type || ''}
        />
        <DataTableFilterBox
          filterKey="isActive"
          title="Estado"
          options={STATUS_OPTIONS}
          setFilterValue={(v) => setFilters({ isActive: v, page: 1 })}
          filterValue={filters.isActive || ''}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
      </Button>

      <CategoriesModal open={open} onOpenChange={setOpen} mode="create" />
    </div>
  );
}
