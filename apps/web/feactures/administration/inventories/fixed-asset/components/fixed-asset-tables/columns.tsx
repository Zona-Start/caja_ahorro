'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ESTATUS_TYPES } from '../../schemas/fixed-asset-options';
import { FixedAsset } from '../../schemas/fixed-asset.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<FixedAsset>[] = [
  {
    accessorKey: 'assetCode',
    header: 'Código del Activo',
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'categoryName',
    header: 'Categoría',
  },
  {
    accessorKey: 'brand',
    header: 'Marca',
  },
  {
    accessorKey: 'model',
    header: 'Modelo',
  },
  {
    accessorKey: 'currentStock',
    header: 'Existencia',
  },
  {
    accessorKey: 'purchasePrice',
    header: 'Precio de Compra',
    cell: ({ row }) => `${row.original.purchasePrice}`,
  },
  {
    accessorKey: 'assetStatus',
    header: 'Estatus',
    cell: ({ row }) => {
      const statusKey = row.original.assetStatus as keyof typeof ESTATUS_TYPES;
      return ESTATUS_TYPES[statusKey] || row.original.assetStatus;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
