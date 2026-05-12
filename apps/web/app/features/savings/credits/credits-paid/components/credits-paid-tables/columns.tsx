import { type ColumnDef } from '@tanstack/react-table';
import type { CreditPaymentApi } from '../schemas/credits-paid-api-response';
import { CellAction } from './cell-action';

export const columns: ColumnDef<CreditPaymentApi>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'creditId',
    header: 'Crédito ID',
  },
  {
    accessorKey: 'creditCustomReference',
    header: 'Referencia Crédito',
    cell: ({ getValue }) => getValue() || '-',
  },
  {
    accessorKey: 'associateFullname',
    header: 'Asociado',
    cell: ({ getValue }) => getValue() || '-',
  },
  {
    accessorKey: 'associateCedula',
    header: 'Cédula',
    cell: ({ getValue }) => getValue() || '-',
  },
  {
    accessorKey: 'paymentDate',
    header: 'Fecha de Pago',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return value ? new Date(value).toLocaleDateString('es-VE') : '-';
    },
  },
  {
    accessorKey: 'paymentType',
    header: 'Tipo de Pago',
  },
  {
    accessorKey: 'amount',
    header: 'Monto',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return `$${Number(value).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
    },
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Método',
  },
  {
    accessorKey: 'status',
    header: 'Estado',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
