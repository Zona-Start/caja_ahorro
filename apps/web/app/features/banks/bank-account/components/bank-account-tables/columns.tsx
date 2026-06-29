import { Badge } from '@repo/shadcn/badge';
import { cn } from '@repo/shadcn/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/lib/format-utils';
import {
  ACCOUNT_TYPE_OPTIONS,
} from '../../schemas/bank-account-options';
import type { BankAccount } from '../../schemas/bank-account.schema';
import { CellAction } from './cell-action';

export const bankAccountColumns: ColumnDef<BankAccount>[] = [
  {
    accessorKey: 'accountName',
    header: 'Nombre',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return value || '-';
    },
  },
  {
    accessorKey: 'accountNumber',
    header: 'Número de Cuenta',
  },
  {
    accessorKey: 'bankDirectoryName',
    header: 'Banco',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return value || '-';
    },
  },
  {
    accessorKey: 'accountType',
    header: 'Tipo',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return (
        ACCOUNT_TYPE_OPTIONS[value as keyof typeof ACCOUNT_TYPE_OPTIONS] ||
        value ||
        '-'
      );
    },
  },
  {
    accessorKey: 'currencyCode',
    header: 'Moneda',
  },
  {
    accessorKey: 'currentBalance',
    header: 'Saldo Libros',
    cell: ({ row, getValue }) => {
      const value = getValue<number>();
      if (value == null) return '-';
      return formatCurrency(value, row.original.currencyCode || 'VES');
    },
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
