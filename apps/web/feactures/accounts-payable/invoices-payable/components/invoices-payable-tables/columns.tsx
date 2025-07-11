'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ESTATUS_TYPES } from '../../schemas/invoices-payable-options';
import { InvoicesPayable } from '../../schemas/invoices-payable.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<InvoicesPayable>[] = [
  {
    accessorKey: 'invoiceNumber',
    header: 'Número de Factura',
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
    accessorKey: 'dueDate',
    header: 'Fecha de Vencimiento',
    cell: ({ row }) => {
      const date = new Date(row.original.dueDate);
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: 'totalAmount',
    header: 'Monto Total',
  },
  {
    accessorKey: 'concept',
    header: 'Concepto',
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
