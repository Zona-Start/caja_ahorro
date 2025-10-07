'use client';

import { Badge } from '@repo/shadcn/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import {
  PAYMENT_METHOD_TYPES,
  SUPPLIER_PAYMENT_STATUS_TYPES,
  SupplierPayment,
} from '../../schemas';

export const columns: ColumnDef<SupplierPayment>[] = [
  {
    accessorKey: 'paymentNumber',
    header: 'Número',
  },
  {
    accessorKey: 'requestedAt',
    header: 'Fecha',
    cell: ({ row }) => {
      const date = new Date(row.original.requestedAt);
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: 'supplierName',
    header: 'Proveedor',
  },
  {
    accessorKey: 'totalAmount',
    header: 'Monto',
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {Number(row.original.totalAmount)} Bs.
        </div>
      );
    },
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Método',
    cell: ({ row }) => {
      const paymentMethod = row.original.paymentMethod;
      const paymenText =
        PAYMENT_METHOD_TYPES[
          paymentMethod as keyof typeof PAYMENT_METHOD_TYPES
        ] || paymentMethod;

      return paymenText;
    },
  },
  {
    accessorKey: 'bankReference',
    header: 'Referencia',
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        SUPPLIER_PAYMENT_STATUS_TYPES[
          status as keyof typeof SUPPLIER_PAYMENT_STATUS_TYPES
        ] || status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'DRAFT':
            return 'default';
          case 'PENDING':
            return 'warning';
          case 'SENT_TO_BANK':
            return 'secondary';
          case 'PROCESSED':
            return 'success';
          case 'CANCELLED':
            return 'secondary';
          case 'REJECTED':
            return 'destructive';
          default:
            return 'outline';
        }
      })();

      return (
        <Badge
          variant={
            variant as
              | 'default'
              | 'destructive'
              | 'outline'
              | 'secondary'
              | 'success'
              | 'danger'
          }
          className={status === 'DRAFT' ? 'bg-pink-200 text-red-800' : ''}
        >
          {statusText}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'accountPayableNumber',
    header: 'Enlace',
  },
  // {
  //   id: 'actions',
  //   header: 'Acciones',
  //   cell: ({ row }) => <CellAction data={row.original} tab="history" />,
  // },
];
