'use client';

import { CellAction } from '@/feactures/common/category-types/components/categories-tables/cell-action';
import { CategoryTypes } from '@/feactures/common/category-types/schemas/category-types-schemas';
import { ColumnDef } from '@tanstack/react-table';

export const columns: ColumnDef<CategoryTypes>[] = [
  {
    accessorKey: 'description',
    header: 'Nombre',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
