import { formatCurrency } from '@/lib/format-utils';
import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import {
  MOVEMENT_STATUS_TYPES,
  MOVEMENT_TYPES,
} from '../../../schemas/inquiry-options';
import type { TransactionHistory } from '../../../schemas/inquiry-schema';

export const columns: ColumnDef<TransactionHistory>[] = [
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => {
      const f = row.original.fecha;
      if (!f) return <span className="text-muted-foreground">N/A</span>;
      return new Date(f).toLocaleDateString('es-VE');
    },
  },
  {
    accessorKey: 'numeroReferencia',
    header: 'Referencia',
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.numeroReferencia || 'N/A'}
      </span>
    ),
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.original.tipo;
      return (
        <Badge variant="outline" className="text-xs font-normal">
          {MOVEMENT_TYPES[tipo as keyof typeof MOVEMENT_TYPES] || tipo}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'descripcion',
    header: 'Descripción',
    cell: ({ row }) => (
      <span
        className={
          row.original.descripcion ? '' : 'text-muted-foreground italic'
        }
      >
        {row.original.descripcion || 'Sin descripción'}
      </span>
    ),
  },
  {
    accessorKey: 'monto',
    header: 'Monto',
    cell: ({ row }) => {
      const monto = Number(row.original.monto);
      return (
        <span className="font-mono font-medium">
          {formatCurrency(monto, 'VES')}
        </span>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        MOVEMENT_STATUS_TYPES[
          status as keyof typeof MOVEMENT_STATUS_TYPES
        ] || status;
      const variant = (() => {
        switch (status) {
          case 'PENDING':
            return 'default' as const;
          case 'COMPLETED':
            return 'success' as const;
          case 'REVERSED':
            return 'destructive' as const;
          case 'CANCELLED':
            return 'warning' as const;
          default:
            return 'default' as const;
        }
      })();
      return <Badge variant={variant as any}>{statusText}</Badge>;
    },
  },
];
