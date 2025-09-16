'use client';

import { Badge } from '@repo/shadcn/badge';
import { ColumnDef } from '@tanstack/react-table';
import { BankAccount } from '../../schemas/bank-account.schema';
import { CellAction } from './cell-action';

const formatCurrency = (value: number, currency: 'VES' | 'USD') => {
  const formatted = new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);

  // If the currency is VES, replace "Bs.S" with "Bs."
  if (currency === 'VES') {
    return formatted.replace('Bs.S', 'Bs.');
  }

  return formatted;
};

export const columns: ColumnDef<BankAccount>[] = [
  {
    accessorKey: 'bankDirectoryName',
    header: 'Banco',
  },
  {
    accessorKey: 'accountNumber',
    header: 'Número Cuenta',
  },
  {
    accessorKey: 'accountName',
    header: 'Nombre',
  },
  {
    accessorKey: 'accountType',
    header: 'Tipo',
    cell: ({ row }) => {
      if (row.original.accountType === 'CURRENT') {
        return <span>Corriente</span>;
      } else {
        return <span>Ahorro</span>;
      }
    },
  },
  {
    accessorKey: 'currencyCode',
    header: 'Moneda',
  },
  {
    accessorKey: 'currentBalance',
    header: 'Saldo Actual',
    cell: ({ row }) => {
      const currency = row.original.currencyCode === 'VES' ? 'VES' : 'USD';
      return (
        <span>
          {formatCurrency(row.original.currentBalance ?? 0, currency)}
        </span>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      return (
        <Badge variant={row.original.isActive ? 'success' : 'danger'}>
          {row.original.isActive ? 'Activa' : 'Inactiva'}
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
