'use client';
import { ColumnDef } from '@tanstack/react-table';
import { ESTATUS_TYPES } from '../../schemas/sales-product-options';
import { SalesProduct } from '../../schemas/sales-product.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<SalesProduct>[] = [
  {
    accessorKey: 'productCode',
    header: 'Código',
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'categoryName',
    header: 'Categoria',
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
    accessorKey: 'defaultSellingPrice',
    header: 'Precio Venta',
    cell: ({ row }) => `$${row.original.defaultSellingPrice}`,
  },
  {
    accessorKey: 'currentStock',
    header: 'Stock',
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const statusKey = row.original.status as keyof typeof ESTATUS_TYPES;
      return ESTATUS_TYPES[statusKey] || row.original.status;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
