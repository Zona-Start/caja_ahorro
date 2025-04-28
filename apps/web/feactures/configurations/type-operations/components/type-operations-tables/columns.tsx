'use client';

import { ColumnDef } from '@tanstack/react-table';
import { GROUP_TYPES } from '../../schemas/type-operations-options';
import { TypeOperations } from '../../schemas/type-operations.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<TypeOperations>[] = [
  {
    accessorKey: 'code',
    header: 'Código',
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'group',
    header: 'Grupo',
    cell: ({ row }) =>
      GROUP_TYPES[row.original.group as keyof typeof GROUP_TYPES],
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
