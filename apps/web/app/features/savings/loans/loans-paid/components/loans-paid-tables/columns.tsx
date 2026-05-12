'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/lib/format-utils';
import { Badge } from '@repo/shadcn/badge';
import { type LoanPaymentApi } from '../../schemas/loans-paid-api-response';
import { PAYMENT_STATUS, PAYMENT_METHOD } from '../../schemas/loans-paid-options';
import { CellAction } from './cell-action';

export const columns: ColumnDef<LoanPaymentApi>[] = [
  {
    accessorKey: 'loanReference',
    header: 'Préstamo',
  },
  {
    accessorKey: 'associateCedula',
    header: 'Cédula Asociado',
  },
  {
    accessorKey: 'associateFullname',
    header: 'Nombre y Apellido',
  },
  {
    accessorKey: 'paymentDate',
    header: 'Fecha de Pago',
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Método de Pago',
    cell: ({ row }) => {
      const method = row.original.paymentMethod as keyof typeof PAYMENT_METHOD;
      return PAYMENT_METHOD[method] || row.original.paymentMethod;
    },
  },
  {
    accessorKey: 'amount',
    header: 'Monto',
    cell: ({ row }) => formatCurrency(Number(row.original.amount), 'VES'),
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        PAYMENT_STATUS[status as keyof typeof PAYMENT_STATUS] || status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'PAID':
            return 'success';
          case 'PENDING':
            return 'warning';
          case 'OVERDUE':
            return 'destructive';
          case 'PARTIAL':
            return 'outline';
          case 'CANCELLED':
            return 'destructive';
          case 'REVERSED':
            return 'secondary';
          default:
            return 'default';
        }
      })();

      return (
        <Badge variant={variant as never}>
          {statusText}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
