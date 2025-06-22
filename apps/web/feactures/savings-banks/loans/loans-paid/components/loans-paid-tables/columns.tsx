'use client';

import { ColumnDef } from '@tanstack/react-table';

import { LoanPaymentApi } from '../../schemas/loans-paid-api-response';
import {
  LOAN_PAYMENT_TYPES,
  PAYMENT_METHOD,
} from '../../schemas/loans-paid-options';
import { CellAction } from './cell-action';

export const columns: ColumnDef<LoanPaymentApi>[] = [
  {
    accessorKey: 'customReference',
    header: 'Código',
  },
  {
    accessorKey: 'paymentDate',
    header: 'Fecha Pago',
  },
  {
    accessorKey: 'paymentType',
    header: 'Tipo Operación',
    cell: ({ row }) => {
      const paymentTypeKey = row.original
        .paymentType as keyof typeof LOAN_PAYMENT_TYPES;
      return LOAN_PAYMENT_TYPES[paymentTypeKey] || '';
    },
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Metodo Pago',
    cell: ({ row }) => {
      const paymentMethodKey = row.original
        .paymentMethod as keyof typeof PAYMENT_METHOD;
      return PAYMENT_METHOD[paymentMethodKey] || '';
    },
  },
  {
    accessorKey: 'amount',
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
