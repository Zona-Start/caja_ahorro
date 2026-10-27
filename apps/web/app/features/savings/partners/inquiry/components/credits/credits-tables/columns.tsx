import { formatCurrency } from '@/lib/format-utils';
import { Badge } from '@repo/shadcn/badge';
import { Progress } from '@repo/shadcn/progress';
import type { ColumnDef } from '@tanstack/react-table';
import { CREDIT_STATUS_TYPES } from '../../../schemas/inquiry-options';
import type { CreditListItem } from '../../../schemas/inquiry-schema';
import { CellAction } from './cell-action';

const getCurrency = (item: CreditListItem) =>
  item.currencyCode &&
  item.currencyCode !== 'VES' &&
  Number(item.exchangeRate ?? 0) > 0
    ? item.currencyCode
    : 'VES';

const getRate = (item: CreditListItem) => {
  const rate = Number(item.exchangeRate ?? 0);
  return rate > 0 ? rate : 1;
};

const getCurrentRate = (item: CreditListItem) => {
  const rate = Number(item.currentExchangeRate ?? 0);
  return rate > 0 ? rate : getRate(item);
};

export const columns: ColumnDef<CreditListItem>[] = [
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
    accessorKey: 'creditType',
    header: 'Tipo',
    cell: ({ row }) => {
      const t = row.original.creditType;
      if (!t) return 'N/A';
      return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    },
  },
  {
    accessorKey: 'creditAmount',
    header: 'Monto Solicitado',
    cell: ({ row }) => {
      const currency = getCurrency(row.original);
      const amount = Number(row.original.creditAmount);
      return (
        <div>
          <span className="font-mono">
            {formatCurrency(amount, currency)}
          </span>
          {currency !== 'VES' && (
            <div className="text-[10px] text-muted-foreground">
              ≈ {formatCurrency(amount * getRate(row.original), 'VES')}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'outstandingBalance',
    header: 'Saldo Pendiente',
    cell: ({ row }) => {
      const currency = getCurrency(row.original);
      const amount = Number(row.original.outstandingBalance || 0);
      return (
        <div>
          <span className="font-mono text-amber-600">
            {formatCurrency(amount, currency)}
          </span>
          {currency !== 'VES' && (
            <div className="text-[10px] text-muted-foreground">
              ≈ {formatCurrency(amount * getCurrentRate(row.original), 'VES')}{' '}
              (tasa del día)
            </div>
          )}
        </div>
      );
    },
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
        CREDIT_STATUS_TYPES[status as keyof typeof CREDIT_STATUS_TYPES] ||
        status;
      const variant = (() => {
        switch (status) {
          case 'REQUESTED':
            return 'default' as const;
          case 'APPROVED':
            return 'outline' as const;
          case 'IN_PAYMENT':
            return 'warning' as const;
          case 'PAID':
            return 'success' as const;
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
