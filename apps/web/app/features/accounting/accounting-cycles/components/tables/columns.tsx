import { Badge } from '@repo/shadcn/badge';
import { cn } from '@repo/shadcn/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import { CYCLE_STATUS_OPTIONS } from '../../schemas/accounting-cycle-options';
import type { AccountingCycle } from '../../schemas/accounting-cycle.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<AccountingCycle>[] = [
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'startDate',
    header: 'Fecha de Inicio',
    cell: ({ row }) => row.original.startDate,
  },
  {
    accessorKey: 'endDate',
    header: 'Fecha de Fin',
    cell: ({ row }) => row.original.endDate,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        CYCLE_STATUS_OPTIONS[status] || status;

      const variant = (() => {
        switch (status) {
          case 'OPEN':
            return 'success' as const;
          case 'PENDING':
            return 'warning' as const;
          case 'CLOSED':
            return 'destructive' as const;
          default:
            return 'default' as const;
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
                | 'warning'
            }
          >
            {statusText}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha de Creación',
    cell: ({ row }) =>
      row.original.createdAt
        ? new Date(row.original.createdAt).toLocaleDateString()
        : 'N/A',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
