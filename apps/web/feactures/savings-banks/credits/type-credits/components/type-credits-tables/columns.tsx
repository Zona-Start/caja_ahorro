'use client';

import { ColumnDef } from '@tanstack/react-table';
import { TypeCredit } from '../../schemas/type-credits.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<TypeCredit>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'interestRate',
    header: 'Interesés Anual',
    cell: ({ getValue }) => `${Math.round(Number(getValue()))} %`,
  },
  {
    accessorKey: 'termType',
    header: 'Plazo o Cuotas',
  },
  {
    accessorKey: 'termUnits',
    header: 'Número de plazo o cuotas',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
