import { formatDbDate } from '@/lib/format-utils';
import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import type { ExchangeRate } from '../schemas/exchange-rates.schema';

const formatRate = (value: string) =>
  Number(value).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });

export const exchangeRatesColumns: ColumnDef<ExchangeRate>[] = [
  {
    accessorKey: 'currencyCode',
    header: 'Moneda',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.currencyCode}</div>
        {row.original.currencyName && (
          <div className="text-xs text-muted-foreground">
            {row.original.currencyName}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'rateDate',
    header: 'Fecha',
    cell: ({ row }) => formatDbDate(row.original.rateDate),
  },
  {
    accessorKey: 'rate',
    header: () => <div className="text-right">Tasa (Bs.)</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono">
        {formatRate(row.original.rate)} Bs.
      </div>
    ),
  },
  {
    accessorKey: 'source',
    header: 'Origen',
    cell: ({ row }) => (
      <Badge
        variant={row.original.source === 'MANUAL' ? 'secondary' : 'outline'}
      >
        {row.original.source === 'MANUAL'
          ? 'Manual'
          : row.original.source || 'BCV'}
      </Badge>
    ),
  },
];
