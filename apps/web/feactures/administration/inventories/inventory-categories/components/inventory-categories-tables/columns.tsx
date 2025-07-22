'use client';

import { ColumnDef } from '@tanstack/react-table';
import { InventoryCategorySchemaAPI } from '../../schemas/inventory-category-api.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<InventoryCategorySchemaAPI>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'group',
    header: 'Grupo',
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
