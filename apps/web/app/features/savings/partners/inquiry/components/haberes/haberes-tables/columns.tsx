import { formatCurrency } from '@/lib/format-utils';
import { type ColumnDef } from '@tanstack/react-table';
import z from 'zod';
import { MOVEMENT_TYPES } from '../../../schemas/inquiry-options';
import { type haberesMovementSchema } from '../../../schemas/inquiry-schema';

export type HaberesData = z.infer<typeof haberesMovementSchema>;

export const columns: ColumnDef<HaberesData>[] = [
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => {
      const fechas = row?.original?.fecha;
      if (!fechas) return 'N/A';
      return new Date(fechas).toLocaleDateString('es-VE');
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
      return formatCurrency(Number(row?.original?.monto), 'VES');
    },
  },
];
