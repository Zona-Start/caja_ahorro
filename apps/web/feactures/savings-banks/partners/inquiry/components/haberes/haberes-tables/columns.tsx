'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { ColumnDef } from '@tanstack/react-table';
import { HaberesData } from '../../../schemas/haberes-schema';
import { MOVEMENT_TYPES } from '../../../schemas/inquiry-options';

export const columns: ColumnDef<HaberesData>[] = [
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => {
      const fechas = row?.original?.fecha;
      if (fechas === undefined) {
        return 'N/A';
      }
      const fechaFormateada = new Date(fechas).toISOString().split('T')[0];
      return fechaFormateada;
    },
  },
  {
    accessorKey: 'concepto',
    header: 'Concepto',
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const movement =
        MOVEMENT_TYPES[row?.original?.tipo as keyof typeof MOVEMENT_TYPES] ||
        row?.original?.tipo;
      return movement || 'N/A';
    },
  },
  {
    accessorKey: 'monto',
    header: 'Monto',
    cell: ({ row }) => {
      const monto = formatCurrency(Number(row?.original?.monto), 'VES');
      return monto || 0;
    },
  },
  // {
  //   id: 'actions',
  //   header: 'Acciones',
  //   cell: ({ row }) => <CellAction data={row.original} />,
  // },
];
