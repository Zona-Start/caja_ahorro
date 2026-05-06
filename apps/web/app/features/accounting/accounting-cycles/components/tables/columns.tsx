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
    cell: ({ row }) => new Date(row.original.startDate).toLocaleDateString(),
  },
  {
    accessorKey: 'endDate',
    header: 'Fecha de Fin',
    cell: ({ row }) => new Date(row.original.endDate).toLocaleDateString(),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        CYCLE_STATUS_OPTIONS[status as keyof typeof CYCLE_STATUS_OPTIONS] ||
        status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'OPEN':
            return 'success';
          case 'CLOSED':
            return 'destructive';
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
            }
          >
            {statusText}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'closedAt',
    header: 'Fecha de Cierre',
    cell: ({ row }) =>
      row.original.closedAt
        ? new Date(row.original.closedAt).toLocaleDateString()
        : 'N/A',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
