import { type ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/lib/format-utils';
import { Badge } from '@repo/shadcn/badge';
import { cn } from '@repo/shadcn/utils';
import { Progress } from '@repo/shadcn/progress';
import { CREDIT_STATUS_TYPES } from '../../../schemas/inquiry-options';
import { type Credit } from '../../../schemas/inquiry-schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Credit>[] = [
  {
    accessorKey: 'creditType',
    header: 'Tipo',
    cell: ({ row }) => {
      const creditType = row.original.creditType;
      if (!creditType) return 'N/A';
      return (
        creditType.charAt(0).toUpperCase() + creditType.slice(1).toLowerCase()
      );
    },
  },
  {
    accessorKey: 'creditAmount',
    header: 'Monto Solicitado',
    cell: ({ row }) => formatCurrency(Number(row.original.creditAmount), 'VES'),
  },
  {
    accessorKey: 'outstandingBalance',
    header: 'Saldo Pendiente',
    cell: ({ row }) =>
      formatCurrency(Number(row.original.outstandingBalance), 'VES'),
  },
  {
    accessorKey: 'progress',
    header: 'Progreso',
    cell: ({ row }) => {
      const progress = parseFloat(row.original.progress);
      return (
        <div className="flex items-center gap-2">
          <Progress value={progress * 10} className="w-[60%]" />
          <span>{progress.toFixed(1)}/10</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'requestDate',
    header: 'Fecha Sol.',
    cell: ({ row }) =>
      new Date(row.original.requestDate).toLocaleDateString('es-VE'),
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        CREDIT_STATUS_TYPES[status as keyof typeof CREDIT_STATUS_TYPES] ||
        status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'REQUESTED':
            return 'outline';
          case 'APPROVED':
            return 'default';
          case 'IN_PAYMENT':
            return 'warning';
          case 'PAID':
            return 'success';
          default:
            return 'default';
        }
      })();

      return (
        <div className={cn('p-2 h-full w-full')}>
          <Badge
            variant={variant as any}
          >
            {statusText}
          </Badge>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
