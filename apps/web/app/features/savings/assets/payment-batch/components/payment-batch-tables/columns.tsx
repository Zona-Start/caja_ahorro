import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@repo/shadcn/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format-utils';
import { type PaymentBatch } from '../schemas/payment-batch-api-response';
import { PAYMENT_BATCH_STATUS } from '../schemas/payment-batch-options';
import { CellAction } from './cell-action';

export const paymentBatchColumns: ColumnDef<PaymentBatch>[] = [
  {
    accessorKey: 'customReference',
    header: 'Referencia',
  },
  {
    accessorKey: 'currencyCode',
    header: 'Moneda',
  },
  {
    accessorKey: 'totalAmount',
    header: 'Monto Total',
    cell: ({ row }) => {
      const amount = Number(row.original.totalAmount);
      const currency = (row.original.currencyCode as 'VES' | 'USD') || 'VES';
      return formatCurrency(amount, currency);
    },
  },
  {
    accessorKey: 'description',
    header: 'Descripcion',
    cell: ({ row }) => row.original.description || '-',
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        PAYMENT_BATCH_STATUS[status as keyof typeof PAYMENT_BATCH_STATUS] || status;

      const variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'success' | 'warning' = (() => {
        switch (status) {
          case 'DRAFT':
            return 'default';
          case 'UPLOADED':
            return 'warning';
          case 'PROCESSED':
            return 'success';
          case 'CANCELLED':
            return 'destructive';
          default:
            return 'default';
        }
      })();

      return (
        <div className={cn('p-2 h-full w-full')}>
          <Badge variant={variant as 'default' | 'destructive' | 'outline' | 'secondary' | 'success' | 'danger'}>
            {statusText}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha Creacion',
    cell: ({ row }) => {
      try {
        return format(new Date(row.original.createdAt), 'dd/MM/yyyy HH:mm');
      } catch {
        return row.original.createdAt;
      }
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
