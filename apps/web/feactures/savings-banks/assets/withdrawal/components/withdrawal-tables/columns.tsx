'use client';

import { ColumnDef } from '@tanstack/react-table';
import { WithdrawalPaymentApi } from '../../schemas/withdrawal-api-response';
import { ESTATUS_TYPES } from '../../schemas/withdrawal-options';
import { CellAction } from './cell-action';

export const columns: ColumnDef<WithdrawalPaymentApi>[] = [
  {
    accessorKey: 'customReference',
    header: 'Referencia',
  },
  {
    accessorKey: 'withdrawalDate',
    header: 'Fecha Retiro',
  },

  {
    accessorKey: 'withdrawalType',
    header: 'Tipo',
  },
  {
    accessorKey: 'requestedAmount',
    header: 'Monto',
  },
  {
    accessorKey: 'associateCedula',
    header: 'Cédula Asociado',
  },
  {
    accessorKey: 'associateFullname',
    header: 'Nombre y apellido asociado',
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const statusKey = row.original.status as keyof typeof ESTATUS_TYPES;
      return ESTATUS_TYPES[statusKey] || row.original.status;
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
