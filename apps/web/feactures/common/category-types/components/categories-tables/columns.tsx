'use client';

import { ColumnDef } from '@tanstack/react-table';
import { CategoryTypes } from '../../schemas/category-types-schemas';
import { CellAction } from './cell-action';

export const columns: ColumnDef<CategoryTypes>[] = [
  {
    accessorKey: 'group',
    header: 'Grupo',
  },
  {
    accessorKey: 'description',
    header: 'Nombre',
  },
  {
    accessorKey: 'options',
    header: 'Otras Opción',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
