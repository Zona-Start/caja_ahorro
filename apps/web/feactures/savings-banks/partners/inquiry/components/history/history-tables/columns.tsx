'use client';

import { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import { MOVEMENT_TYPES } from '../../../schemas/inquiry-options';
import { transactionHistoryResponseSchema } from '../../../schemas/inquiry-schema';

type History = z.infer<typeof transactionHistoryResponseSchema>['data'][number];

export const columns: ColumnDef<History>[] = [
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => new Date(row.original.fecha).toLocaleDateString('es-VE'),
  },
  {
    accessorKey: 'numeroReferencia',
    header: 'Referencia',
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.original.tipo;
      return MOVEMENT_TYPES[tipo as keyof typeof MOVEMENT_TYPES] || tipo;
    },
  },
  {
    accessorKey: 'descripcion',
    header: 'Descripción',
  },
  {
    accessorKey: 'monto',
    header: 'Monto',
    cell: ({ row }) => `Bs. ${row.original.monto}`,
  },
  // {
  //   id: 'actions',
  //   header: 'Acciones',
  //   cell: ({ row }) => <CellAction data={row.original} />,
  // },
];
