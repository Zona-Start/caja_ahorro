'use client';

import { ColumnDef } from '@tanstack/react-table';
import { PaymentBatch } from '../../schemas/payment-batch-api-response';
import { PAYMENT_BATCH_STATUS } from '../../schemas/payment-batch-options';
import { CellAction } from './cell-action';

export const columns: ColumnDef<PaymentBatch>[] = [
  {
    accessorKey: 'id',
    header: 'ID Lote',
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'totalAmount',
    header: 'Monto Total',
  },
  {
    accessorKey: 'currencyCode',
    header: 'Moneda',
  },
  {
    accessorKey: 'recordCount',
    header: 'Ítems',
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const statusKey = row.original.status as keyof typeof PAYMENT_BATCH_STATUS;
      return PAYMENT_BATCH_STATUS[statusKey] || row.original.status;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha Creación',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
