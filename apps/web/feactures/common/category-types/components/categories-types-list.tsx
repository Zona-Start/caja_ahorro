'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { ColumnDef } from '@tanstack/react-table';
import { usePaginatedCategoriesTypes } from '../hooks/use-querys-category-types';
import { CategoryTypes } from '../schemas/category-types-schemas';

interface CategoriesTypesListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialGroup?: string | null;
  columns: ColumnDef<CategoryTypes>[];
}

export default function CategoriesTypesList({
  initialPage,
  initialSearch,
  initialLimit,
  initialGroup,
  columns,
}: CategoriesTypesListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialGroup && { group: initialGroup }),
  };

  const { data, isLoading } = usePaginatedCategoriesTypes(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={initialLimit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data || []}
      totalItems={data?.meta.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
