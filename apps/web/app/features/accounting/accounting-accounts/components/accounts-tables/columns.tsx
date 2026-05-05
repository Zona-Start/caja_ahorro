import type { ColumnDef } from '@tanstack/react-table';
import type { AccountPlanApiResponse } from '../../schemas/account-plan-api';
import {
  ACCOUNT_LEVELS,
  ACCOUNT_TYPES,
} from '../../schemas/account-plan-options';
import { CellAction } from './cell-action';

export const columns: ColumnDef<AccountPlanApiResponse>[] = [
  {
    accessorKey: 'code',
    header: 'Código',
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'accountType',
    header: 'Tipo',
    cell: ({ row }) => {
      const accountType = row.original.accountType;
      const accountTypeText =
        ACCOUNT_TYPES[accountType as keyof typeof ACCOUNT_TYPES] || accountType;
      return <span>{accountTypeText}</span>;
    },
  },
  {
    accessorKey: 'level',
    header: 'Nivel',
    cell: ({ row }) => {
      const level = row.original.level;
      const levelText =
        ACCOUNT_LEVELS[level as keyof typeof ACCOUNT_LEVELS] || level;
      return <span>{levelText}</span>;
    },
  },
  {
    accessorKey: 'allowsMovements',
    header: 'Acepta Movimientos',
    cell: ({ row }) => (row.original.allowsMovements ? 'Sí' : 'No'),
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
