'use client';

import { ColumnDef } from '@tanstack/react-table';
import { SUPPLIER_TRANSACTION_STATUS_TYPES, SUPPLIER_TRANSACTION_TYPES } from '../../schemas/supplier-transaction-options';
import { SupplierTransaction } from '../../schemas/supplier-transaction.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<SupplierTransaction>[] = [
  {
    accessorKey: 'accountsPayable.supplierInvoice.invoiceNumber',
    header: 'Número de Factura',
  },
  {
    accessorKey: 'accountsPayable.supplierInvoice.supplierName',
    header: 'Proveedor',
  },
  {
    accessorKey: 'transactionType',
    header: 'Tipo de Transacción',
    cell: ({ row }) => {
      const typeKey = row.original.transactionType as keyof typeof SUPPLIER_TRANSACTION_TYPES;
      return SUPPLIER_TRANSACTION_TYPES[typeKey] || row.original.transactionType;
    },
  },
  {
    accessorKey: 'transactionDate',
    header: 'Fecha de Transacción',
    cell: ({ row }) => {
      const date = new Date(row.original.transactionDate);
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: 'amount',
    header: 'Monto',
  },
  {
    accessorKey: 'currencyCode',
    header: 'Moneda',
  },
  {
    accessorKey: 'reference',
    header: 'Referencia',
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const statusKey = row.original.status as keyof typeof SUPPLIER_TRANSACTION_STATUS_TYPES;
      return SUPPLIER_TRANSACTION_STATUS_TYPES[statusKey] || row.original.status;
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
