'use client';

import { ColumnDef } from '@tanstack/react-table';
import { TransactionType } from '../../schemas/transaction-type.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<TransactionType>[] = [
  {
    accessorKey: 'code',
    header: 'Código',
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
