'use client';
import { ColumnDef } from '@tanstack/react-table';
import { PRODUCT_STATUS_TYPES } from '../../schemas/product-options';
import { Product } from '../../schemas/product.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'sku',
    header: 'SKU',
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
    accessorKey: 'stockMin',
    header: 'Stock Mínimo',
  },
  {
    accessorKey: 'stockMax',
    header: 'Stock Máximo',
  },
  {
    accessorKey: 'reorderPoint',
    header: 'Punto de Reorden',
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const statusKey = row.original.status as keyof typeof PRODUCT_STATUS_TYPES;
      return PRODUCT_STATUS_TYPES[statusKey] || row.original.status;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
