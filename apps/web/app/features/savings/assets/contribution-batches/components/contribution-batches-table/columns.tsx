'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@repo/shadcn/badge';
import { formatCurrency } from '@/lib/format-utils';
import {
  TYPE_LABEL,
  MOVEMENT_TYPE_LABEL,
  STATUS_LABEL,
} from '../../schemas/contribution-batches-options';
import type { ContributionBatch } from '../../schemas/contribution-batches.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<ContributionBatch>[] = [
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => {
      const type = row.original.type;
      const variant =
        type === 'massive' ? 'secondary' : 'success';
      return (
        <Badge variant={variant as any}>
          {TYPE_LABEL[type] || type}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'entryDate',
    header: 'Fecha',
  },
  {
    accessorKey: 'movementType',
    header: 'Movimiento',
    cell: ({ row }) =>
      MOVEMENT_TYPE_LABEL[row.original.movementType] ||
      row.original.movementType,
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ row }) => row.original.description || '—',
  },
  {
    accessorKey: 'totalAmount',
    header: 'Monto Total',
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {formatCurrency(Number(row.original.totalAmount) || 0, 'VES')}
      </span>
    ),
  },
  {
    accessorKey: 'associateCount',
    header: 'Asociados',
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const status = row.original.status;
      const variant =
        status === 'reversed' ? 'destructive' : 'success';
      return (
        <Badge variant={variant as any}>
          {STATUS_LABEL[status] || status}
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
