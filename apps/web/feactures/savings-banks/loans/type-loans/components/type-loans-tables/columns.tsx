'use client';

import { ColumnDef } from '@tanstack/react-table';
import { TypeLoan } from '../../schemas/type-loans.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<TypeLoan>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'interestRateAnnual',
    header: 'Interesés Anual',
  },
  {
    accessorKey: 'termMonthsMin',
    header: 'Duración Mínima (Meses)',
  },
  {
    accessorKey: 'termMonthsMax',
    header: 'Duración Máxima (Meses)',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
