import { type ColumnDef } from '@tanstack/react-table';
import type { CreditType } from '../../schemas/credit-types.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<CreditType>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ getValue }) => getValue() || '-',
  },
  {
    accessorKey: 'interestRate',
    header: 'Tasa Interés',
    cell: ({ getValue }) => `${Number(getValue())} %`,
  },
  {
    accessorKey: 'termType',
    header: 'Tipo',
  },
  {
    accessorKey: 'termUnits',
    header: 'Cantidad',
  },
  {
    accessorKey: 'administrativeExpensePercentage',
    header: '% Gasto Admin',
    cell: ({ getValue }) => `${Number(getValue())} %`,
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];