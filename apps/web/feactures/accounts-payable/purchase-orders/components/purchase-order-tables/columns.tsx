'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ESTATUS_TYPES } from '../../schemas/purchase-order-options';
import { PurchaseOrder } from '../../schemas/purchase-order.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<PurchaseOrder>[] = [
  {
    accessorKey: 'invoiceNumber',
    header: 'Factura',
  },
  {
    accessorKey: 'supplierName',
    header: 'Proveedor',
  },
  {
    accessorKey: 'purchaseDate',
    header: 'Fecha',
    cell: ({ row }) => {
      const date = new Date(row.original.purchaseDate);
      return date.toLocaleDateString();
    },
  },

  {
    accessorKey: 'items',
    header: 'items',
    cell: ({ row }) => {
      const items = row.original.items.length;
      return `${items} ítems`;
    },
  },
  {
    accessorKey: 'totalAmount',
    header: 'Monto Total',
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
