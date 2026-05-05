import { type ColumnDef } from '@tanstack/react-table';
import { type WithdrawalTypes } from '../../schemas/withdrawal-types.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<WithdrawalTypes>[] = [
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'withdrawalPercentage',
    header: 'Porcentaje Rétiro',
    cell: ({ getValue }) => `${Math.round(Number(getValue()))} %`,
  },
  {
    accessorKey: 'administrativeFeePercentage',
    header: 'Porcentaje Administrativo',
    cell: ({ getValue }) => `${getValue()} %`,
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
