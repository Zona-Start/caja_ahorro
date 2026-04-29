'use client';

import { Badge } from '@repo/shadcn/components/ui/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import {
  MOVEMENT_STATUS_TYPES,
  MOVEMENT_TYPES,
} from '../../../schemas/inquiry-options';
import { transactionHistoryResponseSchema } from '../../../schemas/inquiry-schema';

type History = z.infer<typeof transactionHistoryResponseSchema>['data'][number];

export const columns: ColumnDef<History>[] = [
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
            variant={
              variant as
                | 'default'
                | 'destructive'
                | 'outline'
                | 'secondary'
                | 'success'
                | 'danger'
            }
          >
            {statusText}
          </Badge>
        </div>
      );
    },
  },
  // {
  //   id: 'actions',
  //   header: 'Acciones',
  //   cell: ({ row }) => <CellAction data={row.original} />,
  // },
];
