'use client';

import { ColumnDef } from '@tanstack/react-table';
import { BankAccount } from '../../schemas/bank-account.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<BankAccount>[] = [
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
  },
  {
    accessorKey: 'currencyCode',
    header: 'Moneda',
  },
  {
    accessorKey: 'currentBalance',
    header: 'Saldo Actual',
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      if (row.original.isActive === true) {
        return <span className="text-green-500">Activa</span>;
      } else {
        return <span className="text-red-500">Inactiva</span>;
      }
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
