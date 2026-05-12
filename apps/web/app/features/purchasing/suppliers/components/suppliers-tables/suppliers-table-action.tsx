import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { SuppliersFilters } from '../../hooks/use-suppliers-filters';

interface SuppliersTableActionProps {
  filters: SuppliersFilters;
  setFilters: (newFilters: Partial<SuppliersFilters>) => void;
  clearFilters: () => void;
  onCreateClick: () => void;
}

export function SuppliersTableAction({
  filters,
  setFilters,
  clearFilters,
  onCreateClick,
}: SuppliersTableActionProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchValue !== (filters.search || '')) {
        setFilters({ search: searchValue, page: 1 });
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchValue]);

  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  const hasActiveFilters = !!filters.search;

  const handleClear = () => {
    setSearchValue('');
    clearFilters();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Input
          placeholder="Buscar proveedores..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full sm:w-[300px]"
        />
        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleClear} className="h-9 px-2">
            <X className="mr-1 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      <Button onClick={onCreateClick} className="w-full sm:w-auto">
        <Plus className="mr-2 h-4 w-4" />
        Nuevo Proveedor
      </Button>
    </div>
  );
}
