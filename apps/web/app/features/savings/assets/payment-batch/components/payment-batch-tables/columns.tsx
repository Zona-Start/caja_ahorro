import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@repo/shadcn/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format-utils';
import { type PaymentBatch } from '../../services/payment-batch-service';
import { PAYMENT_BATCH_STATUS, BATCH_TYPE } from '../../schemas/payment-batch-options';
import { CellAction } from './cell-action';

export const paymentBatchColumns: ColumnDef<PaymentBatch>[] = [
  {
    accessorKey: 'paymentBatchReference',
    header: 'Referencia',
    cell: ({ row }) => (
      <span className="font-medium">{row.original.paymentBatchReference}</span>
    ),
  },
  {
    accessorKey: 'batchType',
    header: 'Tipo',
    cell: ({ row }) => {
      const type = row.original.batchType;
      const label = BATCH_TYPE[type as keyof typeof BATCH_TYPE] || type;
      return (
        <Badge variant="outline" className="capitalize">
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'currencyCode',
    header: 'Moneda',
    cell: ({ row }) => row.original.currencyCode,
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
    accessorKey: 'recordCount',
    header: 'Registros',
  },
  {
    accessorKey: 'bank',
    header: 'Banco',
    cell: ({ row }) => {
      const bank = row.original.bank;
      if (!bank) return '-';
      return (
        <div className="flex flex-col text-xs">
          <span>{bank.name}</span>
          <span className="text-muted-foreground">{bank.accountNumber}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const status = row.original.status;
      const label =
        PAYMENT_BATCH_STATUS[status as keyof typeof PAYMENT_BATCH_STATUS] || status;

      const variant: Record<string, string> = {
        DRAFT: 'secondary',
        UPLOADED: 'warning',
        PROCESSED: 'success',
        CANCELLED: 'destructive',
      };

      return (
        <Badge variant={(variant[status] || 'default') as any}>
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ row }) => row.original.description || '-',
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha Creación',
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
