'use client';

import { ColumnDef } from '@tanstack/react-table';
import { SalesProductCategorySchemaAPI } from '../../schemas/sales-product-categories-api.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<SalesProductCategorySchemaAPI>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
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
