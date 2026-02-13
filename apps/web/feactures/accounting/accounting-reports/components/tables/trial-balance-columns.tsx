'use client';

import { ColumnDef } from '@tanstack/react-table';
import { TrialBalanceAccount } from '../../schemas/trial-balance.schema';

export const columns: ColumnDef<TrialBalanceAccount>[] = [
  {
    accessorKey: 'accountCode',
    header: 'Código',
  },
  {
    accessorKey: 'accountName',
    header: 'Cuenta',
    cell: ({ row }) => {
      const level = row.original.level;
      return (
        <span style={{ paddingLeft: `${(level - 1) * 10}px` }}>
          {row.original.accountName}
        </span>
      );
    },
  },
  {
    accessorKey: 'accountNature',
    header: 'Naturaleza',
  },
  {
    accessorKey: 'initialBalance',
    header: () => <div className="text-right">Saldo Inicial</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('initialBalance'));
      const formatted = new Intl.NumberFormat('es-VE', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
      return <div className="text-right font-mono">{formatted}</div>;
    },
  },
  {
    accessorKey: 'periodDebit',
    header: () => <div className="text-right">Débito</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('periodDebit'));
      const formatted = new Intl.NumberFormat('es-VE', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
      return <div className="text-right font-mono">{formatted}</div>;
    },
  },
  {
    accessorKey: 'periodCredit',
    header: () => <div className="text-right">Crédito</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('periodCredit'));
      const formatted = new Intl.NumberFormat('es-VE', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
      return <div className="text-right font-mono">{formatted}</div>;
    },
  },
  {
    accessorKey: 'currentBalance',
    header: () => <div className="text-right">Saldo Actual</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('currentBalance'));
      const formatted = new Intl.NumberFormat('es-VE', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
      return <div className="text-right font-mono">{formatted}</div>;
    },
  },
];
