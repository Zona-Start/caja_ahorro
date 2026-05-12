import { Badge } from '@repo/shadcn/badge';
import { cn } from '@repo/shadcn/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/lib/format-utils';
import type { BankAccount } from '../../services/bank-account-service';
import { CellAction } from './cell-action';

export const columns: ColumnDef<BankAccount>[] = [
  {
    accessorKey: 'accountName',
    header: 'Nombre de Cuenta',
  },
  {
    accessorKey: 'accountNumber',
    header: 'Número de Cuenta',
  },
  {
    accessorKey: 'accountType',
    header: 'Tipo',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return value || '-';
    },
  },
  {
    accessorKey: 'bank',
    header: 'Banco',
    cell: ({ getValue }) => {
      const value = getValue<{ id: number; name: string } | undefined>();
      return value?.name || '-';
    },
  },
  {
    accessorKey: 'balance',
    header: 'Balance',
    cell: ({ getValue }) => {
      const value = getValue<number>();
      return value != null ? formatCurrency(value, 'VES') : '-';
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      const isActive = value === 'ACTIVE';
      return (
        <div className={cn('p-2 h-full w-full')}>
          <Badge variant={isActive ? 'success' : 'destructive'}>
            {isActive ? 'Activo' : value || 'Desconocido'}
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
