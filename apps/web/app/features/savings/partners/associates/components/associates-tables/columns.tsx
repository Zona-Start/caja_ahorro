import { Badge } from '@repo/shadcn/components/ui/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { ESTATUS_TYPES } from '../../schemas/associates-options';
import { type AssociatesMutate } from '../../schemas/associates.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<AssociatesMutate>[] = [
  {
    accessorKey: 'nationality',
    header: 'Nacionalidad',
  },
  {
    accessorKey: 'cedula',
    header: 'Cédula',
  },
  {
    accessorKey: 'fullname',
    header: 'Nombre y Apellido',
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        ESTATUS_TYPES[status as keyof typeof ESTATUS_TYPES] || status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'ACTIVE':
            return 'success';
          case 'INACTIVE':
            return 'destructive';
          case 'PENDING':
            return 'warning';
          case 'SUSPENDED':
            return 'secondary';
          case 'LOCKED':
            return 'outline';
          case 'RETIRED':
            return 'destructive';
          case 'ARCHIVED':
            return 'default';
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
    accessorKey: 'isPayrollCredit',
    header: 'Credi-Nomina',
    cell: ({ row }) => {
      if (row.original.isPayrollCredit === true) {
        return <span className="text-red-500">SI</span>;
      } else {
        return <span>No</span>;
      }
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
