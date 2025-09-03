
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { SUPPLIER_PAYMENT_STATUS_TYPES } from '../../schemas';
import { SupplierPaymentAPI } from '../../schemas';
import { CellAction } from './cell-action';

export const columns: ColumnDef<SupplierPaymentAPI>[] = [
  {
    accessorKey: 'paymentNumber',
    header: 'Referencia',
  },
  {
    accessorKey: 'supplier.name',
    header: 'Proveedor',
  },
  {
    accessorKey: 'totalAmount',
    header: 'Monto Total',
    cell: ({ row }) => {
      const amount = parseFloat(row.original.totalAmount);
      const currencyCode = row.original.currencyCode;
      const formatted = new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: currencyCode,
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const statusKey = row.original.status as keyof typeof SUPPLIER_PAYMENT_STATUS_TYPES;
      return SUPPLIER_PAYMENT_STATUS_TYPES[statusKey] || row.original.status;
    },
  },
  {
    accessorKey: 'requestedAt',
    header: 'Fecha de Solicitud',
    cell: ({ row }) => {
      const date = new Date(row.original.requestedAt);
      return date.toLocaleDateString();
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
