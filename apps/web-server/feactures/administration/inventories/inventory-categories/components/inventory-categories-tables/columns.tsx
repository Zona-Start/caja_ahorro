'use client';

import { ColumnDef } from '@tanstack/react-table';
import { InventoryCategorySchemaAPI } from '../../schemas/inventory-category-api.schema';
import { GROUP_TYPES } from '../../schemas/inventory-category-options';
import { CellAction } from './cell-action';

export const columns: ColumnDef<InventoryCategorySchemaAPI>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'group',
    header: 'Grupo',
    cell: ({ row }) => {
      const groupKey = row.original.group as keyof typeof GROUP_TYPES;
      return GROUP_TYPES[groupKey] || row.original.group;
    },
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
