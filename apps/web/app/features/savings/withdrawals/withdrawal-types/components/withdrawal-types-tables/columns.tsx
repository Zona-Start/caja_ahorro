import { type ColumnDef } from '@tanstack/react-table';
import type { WithdrawalType } from '../../schemas/withdrawal-types.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<WithdrawalType>[] = [
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'withdrawalPercentage',
    header: '% Maximo Retiro',
    cell: ({ getValue }) => {
      const value = getValue();
      return value != null ? `${Number(value).toFixed(2)} %` : '-';
    },
  },
  {
    accessorKey: 'administrativeFeePercentage',
    header: '% Administrativo',
    cell: ({ getValue }) => {
      const value = getValue();
      return value != null ? `${Number(value).toFixed(2)} %` : '-';
    },
  },
  {
    accessorKey: 'isHouseComercial',
    header: 'Casa Comercial',
    cell: ({ getValue }) => (getValue() ? 'Sí' : 'No'),
  },
  {
    accessorKey: 'isInternalInventory',
    header: 'Inventario',
    cell: ({ getValue }) => (getValue() ? 'Sí' : 'No'),
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
