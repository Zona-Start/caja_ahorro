import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@repo/shadcn/badge';
import { cn } from '@repo/shadcn/utils';
import {
  MOVEMENT_STATUS_TYPES,
  MOVEMENT_TYPES,
} from '../../../schemas/inquiry-options';
import { type TransactionHistory } from '../../../schemas/inquiry-schema';

export const columns: ColumnDef<TransactionHistory>[] = [
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => new Date(row.original.fecha).toLocaleDateString('es-VE'),
  },
  {
    accessorKey: 'numeroReferencia',
    header: 'Referencia',
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.original.tipo;
      return MOVEMENT_TYPES[tipo as keyof typeof MOVEMENT_TYPES] || tipo;
    },
  },
  {
    accessorKey: 'descripcion',
    header: 'Descripción',
  },
  {
    accessorKey: 'monto',
    header: 'Monto',
    cell: ({ row }) => `Bs. ${row.original.monto}`,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        MOVEMENT_STATUS_TYPES[status as keyof typeof MOVEMENT_STATUS_TYPES] ||
        status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'PENDING':
            return 'default';
          case 'COMPLETED':
            return 'success';
          case 'REVERSED':
            return 'destructive';
          case 'CANCELLED':
            return 'warning';
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
];
