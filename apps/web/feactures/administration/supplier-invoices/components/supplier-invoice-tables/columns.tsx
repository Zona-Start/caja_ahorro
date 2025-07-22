'use client';

import { ColumnDef } from '@tanstack/react-table';
import { SUPPLIER_INVOICE_STATUS_TYPES } from '../../schemas/supplier-invoice-options';
import { SupplierInvoice } from '../../schemas/supplier-invoice.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<SupplierInvoice>[] = [
  {
    accessorKey: 'invoiceNumber',
    header: 'Número de Factura',
  },
  {
    accessorKey: 'supplierName',
    header: 'Proveedor',
  },
  {
    accessorKey: 'invoiceDate',
    header: 'Fecha de Factura',
    cell: ({ row }) => {
      const date = new Date(row.original.invoiceDate);
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: 'totalAmount',
    header: 'Monto Total',
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const statusKey = row.original.status as keyof typeof SUPPLIER_INVOICE_STATUS_TYPES;
      return SUPPLIER_INVOICE_STATUS_TYPES[statusKey] || row.original.status;
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
