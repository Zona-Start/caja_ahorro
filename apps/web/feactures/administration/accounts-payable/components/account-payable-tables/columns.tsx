'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ACCOUNT_PAYABLE_STATUS_TYPES } from '../../schemas/account-payable-options';
import { AccountPayable } from '../../schemas/account-payable.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<AccountPayable>[] = [
  {
    accessorKey: 'supplierInvoice.invoiceNumber',
    header: 'Número de Factura',
  },
  {
    accessorKey: 'supplierInvoice.supplierName',
    header: 'Proveedor',
  },
  {
    accessorKey: 'originalAmount',
    header: 'Monto Original',
  },
  {
    accessorKey: 'paidAmount',
    header: 'Monto Pagado',
  },
  {
    accessorKey: 'remainingAmount',
    header: 'Monto Restante',
  },
  {
    accessorKey: 'currencyCode',
    header: 'Moneda',
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const statusKey = row.original.status as keyof typeof ACCOUNT_PAYABLE_STATUS_TYPES;
      return ACCOUNT_PAYABLE_STATUS_TYPES[statusKey] || row.original.status;
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
