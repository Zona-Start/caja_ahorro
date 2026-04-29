'use client';

import { ColumnDef } from '@tanstack/react-table';
import { AccountingBalance } from '../../schemas/accounting-balance.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<AccountingBalance>[] = [
  {
    accessorKey: 'accountCode',
    header: 'Código de Cuenta',
  },
  {
    accessorKey: 'accountName',
    header: 'Nombre de Cuenta',
  },
  {
    accessorKey: 'accountNature',
    header: 'Naturaleza',
    cell: ({ row }) => {
      const nature = row.original.accountNature;
      return nature === 'DEBIT' ? 'Deudora' : 'Acreedora';
    },
  },
  {
    accessorKey: 'initialBalance',
    header: 'Saldo Inicial',
    cell: ({ row }) => {
      const value = parseFloat(row.original.initialBalance);
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
      }).format(value);
    },
  },
  {
    accessorKey: 'debitBalance',
    header: 'Débitos',
    cell: ({ row }) => {
      const value = parseFloat(row.original.debitBalance);
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
      }).format(value);
    },
  },
  {
    accessorKey: 'creditBalance',
    header: 'Créditos',
    cell: ({ row }) => {
      const value = parseFloat(row.original.creditBalance);
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
      }).format(value);
    },
  },
  {
    accessorKey: 'finalBalance',
    header: 'Saldo Final',
    cell: ({ row }) => {
      const value = parseFloat(row.original.finalBalance);
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
      }).format(value);
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
