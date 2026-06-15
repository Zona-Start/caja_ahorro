import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { TenantsFilters } from '../../hooks/use-tenants-filters';

interface TenantsFiltersActionProps {
  filters: TenantsFilters;
  setFilters: (newFilters: Partial<TenantsFilters>) => void;
  clearFilters: () => void;
  onCreateClick: () => void;
}

export function TenantsFiltersAction({
  filters,
  setFilters,
  clearFilters,
  onCreateClick,
}: TenantsFiltersActionProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');

  // Debounce: sync local input → URL after 400ms of inactivity
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchValue !== (filters.search || '')) {
        setFilters({ search: searchValue, page: 1 });
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchValue]);

  // Sync URL → local input (e.g. when user clicks "Limpiar")
  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  const hasActiveFilters =
    !!filters.search || filters.isActive !== 'true' || filters.businessType !== 'all';

  const handleClear = () => {
    setSearchValue('');
    clearFilters();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Input
          placeholder="Buscar tenants..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full sm:w-[250px]"
        />
        <Select
          value={filters.businessType}
          onValueChange={(value) =>
            setFilters({
              businessType: value as 'all' | 'CAJA_AHORRO' | 'EMPRESA_COMERCIAL',
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="CAJA_AHORRO">Caja de Ahorro</SelectItem>
            <SelectItem value="EMPRESA_COMERCIAL">Empresa Comercial</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.isActive}
          onValueChange={(value) =>
            setFilters({
              isActive: value as 'all' | 'true' | 'false',
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Activos</SelectItem>
            <SelectItem value="false">Inactivos</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleClear} className="h-9 px-2">
            <X className="mr-1 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      <Button onClick={onCreateClick} className="w-full sm:w-auto">
        <Plus className="mr-2 h-4 w-4" />
        Nuevo Tenant
      </Button>
    </div>
  );
}
