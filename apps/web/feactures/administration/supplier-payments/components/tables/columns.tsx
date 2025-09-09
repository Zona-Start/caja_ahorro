'use client';

import { Badge } from '@repo/shadcn/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { SUPPLIER_PAYMENT_STATUS_TYPES, SupplierPayment } from '../../schemas';
import { CellAction } from './cell-action';

export const columns: ColumnDef<SupplierPayment>[] = [
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
      const amount = row.original.totalAmount;
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
            return 'outline';
          case 'PEN_APR':
            return 'warning';
          case 'PROCESSED':
            return 'success';
          case 'ANULADO':
          case 'REJECTED':
            return 'destructive';
          default:
            return 'secondary';
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
