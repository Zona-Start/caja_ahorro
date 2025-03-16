'use client';

import { ColumnDef } from '@tanstack/react-table';
import { AccountPlan } from '../../schemas/account-plan.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<AccountPlan>[] = [
  {
    accessorKey: 'code',
    header: 'Código',
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'typeLabel',
    header: 'Tipo',
  },
  {
    accessorKey: 'levelLabel',
    header: 'Nivel',
  },
  {
    accessorKey: 'parentAccountCode',
    header: 'Cuenta Padre',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
