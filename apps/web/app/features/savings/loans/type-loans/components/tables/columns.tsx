import { type ColumnDef } from '@tanstack/react-table';
import type { LoanType } from '../../schemas/loan-types.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<LoanType>[] = [
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
    header: 'Tipo Plazo',
  },
  {
    accessorKey: 'termUnits',
    header: 'Unidades',
  },
  {
    accessorKey: 'administrativeExpensePercentage',
    header: '% Gasto Administrativo',
    cell: ({ getValue }) => `${Number(getValue())} %`,
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];