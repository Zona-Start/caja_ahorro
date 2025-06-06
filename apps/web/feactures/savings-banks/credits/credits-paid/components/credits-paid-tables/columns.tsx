'use client';

import { ColumnDef } from '@tanstack/react-table';

import { CreditPaymentApi } from '../../schemas/credits-paid-api-response';
import {
  CREDIT_PAYMENT_TYPES,
  PAYMENT_METHOD,
} from '../../schemas/credits-paid-options';
import { CellAction } from './cell-action';

export const columns: ColumnDef<CreditPaymentApi>[] = [
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
        .paymentType as keyof typeof CREDIT_PAYMENT_TYPES;
      return CREDIT_PAYMENT_TYPES[paymentTypeKey] || '';
    },
  },
  {
    accessorKey: 'bankName',
    header: 'Nombre Banco',
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
    accessorKey: 'transactionReference',
    header: 'Referencia Banco',
  },
  {
    accessorKey: 'associateCedula',
    header: 'Cédula Asociado',
  },
  {
    accessorKey: 'associatesFullname',
    header: 'Nombre y Apellido Asociado',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
