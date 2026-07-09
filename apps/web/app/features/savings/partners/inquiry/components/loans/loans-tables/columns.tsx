import { formatCurrency } from '@/lib/format-utils';
import { Badge } from '@repo/shadcn/badge';
import { Progress } from '@repo/shadcn/progress';
import type { ColumnDef } from '@tanstack/react-table';
import { LOAN_STATUS_TYPES } from '../../../schemas/inquiry-options';
import type { LoanListItem } from '../../../schemas/inquiry-schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<LoanListItem>[] = [
  {
    accessorKey: 'customReference',
    header: 'Ref.',
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.customReference || 'N/A'}
      </span>
    ),
  },
  {
    accessorKey: 'loanType',
    header: 'Tipo',
    cell: ({ row }) => row.original.loanType || 'N/A',
  },
  {
    accessorKey: 'loanAmount',
    header: 'Monto Solicitado',
    cell: ({ row }) => (
      <span className="font-mono">
        {formatCurrency(Number(row.original.loanAmount), 'VES')}
      </span>
    ),
  },
  {
    accessorKey: 'outstandingBalance',
    header: 'Saldo Pendiente',
    cell: ({ row }) => (
      <span className="font-mono text-amber-600">
        {formatCurrency(Number(row.original.outstandingBalance || 0), 'VES')}
      </span>
    ),
  },
  {
    accessorKey: 'progress',
    header: 'Progreso',
    cell: ({ row }) => {
      const progress = parseFloat(row.original.progress) * 100;
      return (
        <div className="flex items-center gap-2 min-w-[100px]">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground w-10 text-right">
            {progress.toFixed(0)}%
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'requestDate',
    header: 'Fecha Sol.',
    cell: ({ row }) => {
      const d = row.original.requestDate;
      if (!d) return <span className="text-muted-foreground">N/A</span>;
      return new Date(d).toLocaleDateString('es-VE');
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        LOAN_STATUS_TYPES[status as keyof typeof LOAN_STATUS_TYPES] || status;
      const variant = (() => {
        switch (status) {
          case 'REQUESTED':
            return 'default' as const;
          case 'APPROVED':
            return 'outline' as const;
          case 'DISBURSED':
            return 'warning' as const;
          case 'IN_PAYMENT':
            return 'secondary' as const;
          case 'PAID':
            return 'success' as const;
          case 'CANCELLED':
          case 'REJECTED':
            return 'destructive' as const;
          default:
            return 'default' as const;
        }
      })();
      return <Badge variant={variant as any}>{statusText}</Badge>;
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
