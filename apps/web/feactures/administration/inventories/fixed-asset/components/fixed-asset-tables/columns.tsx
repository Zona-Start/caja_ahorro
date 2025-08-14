'use client';
import { ColumnDef } from '@tanstack/react-table';
import { FixedAssetSchemaAPI } from '../../schemas/fixed-asset-api.schema';
import { ESTATUS_TYPES } from '../../schemas/fixed-asset-options';
import { CellAction } from './cell-action';

export const columns: ColumnDef<FixedAssetSchemaAPI>[] = [
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
    accessorKey: 'totalCost',
    header: 'Precio de Compra',
    cell: ({ row }) => {
      const totalCost = Number(row.original.totalCost).toFixed(2);
      return String(totalCost);
    },
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
    cell: ({ row }) => {
      const data = {
        ...row.original,
        acquisitionDate: new Date(row.original.acquisitionDate),
      };
      return <CellAction data={data} />;
    },
  },
];
