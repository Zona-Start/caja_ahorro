import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useCategoriesFilters } from '../hooks/use-categories-filters';
import { useCategoriesQuery } from '../hooks/use-categories-queries';
import { CATEGORY_TYPES } from '../schemas/categories.schema';
import { columns } from './tables/columns';
import { CategoriesHeader } from './categories-header';
import { CategoriesModal } from './categories-modal';

export default function CategoriesList() {
  const { filters, setFilters } = useCategoriesFilters();
  const { data, isLoading } = useCategoriesQuery(filters);
  const [openModal, setOpenModal] = useState(false);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={filters.limit} />;
  }

  const categoriesData = data?.data || [];

  return (
    <div className="space-y-4">
      <CategoriesHeader />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar categorías..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="w-full sm:w-[250px]"
          />
          <Select
            value={filters.type || 'all'}
            onValueChange={(value) =>
              setFilters({ type: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(CATEGORY_TYPES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.isActive !== undefined ? String(filters.isActive) : 'all'}
            onValueChange={(value) =>
              setFilters({
                isActive: value === 'all' ? undefined : value === 'true',
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
        </div>

        <Button onClick={() => setOpenModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={categoriesData}
        totalItems={data?.total || 0}
        pageSizeOptions={[10, 20, 30, 50]}
      />

      <CategoriesModal
        open={openModal}
        onOpenChange={setOpenModal}
        mode="create"
      />
    </div>
  );
}