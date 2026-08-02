import { Badge } from '@repo/shadcn/badge';
import { cn } from '@repo/shadcn/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import type { Bank } from '../../services/banks-service';
import { CellAction } from './cell-action';

export const banksColumns: ColumnDef<Bank>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'code',
    header: 'Código',
  },
  {
    accessorKey: 'isActive',
    header: 'Estado',
    cell: ({ getValue }) => {
      const value = getValue<boolean>();
      return (
        <div className={cn('p-2 h-full w-full')}>
          <Badge variant={value ? 'success' : 'destructive'}>
            {value ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
