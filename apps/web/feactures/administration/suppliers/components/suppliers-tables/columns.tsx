'use client';

import { ColumnDef } from '@tanstack/react-table';
import {
  ESTATUS_TYPES,
  SUPPLIER_CATEGORY_TYPES,
} from '../../schemas/suppliers-options';
import { Supplier } from '../../schemas/suppliers.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Supplier>[] = [
  {
    accessorKey: 'code',
    header: 'Código',
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'taxId',
    header: 'Rif',
  },
  {
    accessorKey: 'contactName',
    header: 'Contacto',
  },
  {
    accessorKey: 'category',
    header: 'Categoria',
    cell: ({ row }) => {
      const categoryKey = row.original
        .category as keyof typeof SUPPLIER_CATEGORY_TYPES;
      return SUPPLIER_CATEGORY_TYPES[categoryKey] || row.original.category;
    },
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
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
