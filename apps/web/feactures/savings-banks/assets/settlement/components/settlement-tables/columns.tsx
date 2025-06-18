'use client';

import { ColumnDef } from '@tanstack/react-table';
import { SettlementPaymentApi } from '../../schemas/settlement-api-response';
import { CellAction } from './cell-action';

export const columns: ColumnDef<SettlementPaymentApi>[] = [
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
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
