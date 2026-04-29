'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Banks } from '../../schemas/banks.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Banks>[] = [
  {
    accessorKey: 'code',
    header: 'Código',
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
