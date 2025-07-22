'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ESTATUS_TYPES } from '../../schemas/purchase-order-options';
import { PurchaseOrder } from '../../schemas/purchase-order.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<PurchaseOrder>[] = [
  {
    accessorKey: 'orderNumber',
    header: 'Número de Orden',
  },
  {
    accessorKey: 'supplierName',
    header: 'Proveedor',
  },
  {
    accessorKey: 'orderDate',
    header: 'Fecha de Orden',
    cell: ({ row }) => {
      const date = new Date(row.original.orderDate);
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: 'orderType',
    header: 'Tipo de Orden',
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
