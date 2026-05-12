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
    cell: ({ getValue }) => `${Number(getValue()).toFixed(2)} %`,
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
    accessorKey: 'minCreditAmount',
    header: 'Monto Mín',
    cell: ({ getValue }) => {
      const value = getValue();
      return value != null ? `$${Number(value).toLocaleString()}` : '-';
    },
  },
  {
    accessorKey: 'maxCreditAmount',
    header: 'Monto Máx',
    cell: ({ getValue }) => {
      const value = getValue();
      return value != null ? `$${Number(value).toLocaleString()}` : '-';
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];