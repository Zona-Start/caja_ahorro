'use client';

import { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@repo/shadcn/badge';
import { LoanPaymentApi } from '../../schemas/loans-paid-api-response';
import {
  LOAN_PAYMENT_TYPES,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
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
    accessorKey: 'paymentStatus',
    header: 'Estatus Pago',
    cell: ({ row }) => {
      const status = row.original.paymentStatus;
      const paymentStatusKey = status as keyof typeof PAYMENT_STATUS;
      const label = PAYMENT_STATUS[paymentStatusKey] || status;

      let variant: 'default' | 'outline' | 'secondary' | 'destructive' | 'success' = 'default';
      
      if (status === 'DONE') variant = 'success';
      if (status === 'CANCELED') variant = 'destructive';

      return (
        <Badge variant={variant} className="font-medium">
          {label}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
