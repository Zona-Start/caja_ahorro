'use client';

import { ColumnDef } from '@tanstack/react-table';
import { FixedAssetCategoriesSchemaAPI } from '../../schemas/fixed-asset-categories-api.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<FixedAssetCategoriesSchemaAPI>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'defaultUsefulLifeYears',
    header: 'Vida útil',
  },
  {
    accessorKey: 'defaultDepreciationMethod',
    header: 'Método de depreciación',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
