'use client';

import { Badge } from '@repo/shadcn/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { SUPPLIER_INVOICE_STATUS_TYPES } from '../../schemas/supplier-invoice-options';
import { SupplierInvoice } from '../../schemas/supplier-invoice.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<SupplierInvoice>[] = [
  {
    accessorKey: 'supplierInvoiceNumber',
    header: 'Referencia',
  },

  {
    accessorKey: 'supplierName',
    header: 'Proveedor',
  },
  {
    accessorKey: 'invoiceNumber',
    header: 'N° Factura',
  },
  {
    accessorKey: 'invoiceDate',
    header: 'Fecha',
    cell: ({ row }) => {
      const date = new Date(row.original.invoiceDate);
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: 'dueDate',
    header: 'Vencimiento',
    cell: ({ row }) => {
      const date = new Date(row.original.dueDate ?? '');
      return date.toLocaleDateString();
    },
  },

  {
    accessorKey: 'totalAmount',
    header: 'Monto',
    cell: ({ row }) => {
      const data = row.original.totalAmount;

      return `${data} Bs`;
    },
  },
  {
    accessorKey: 'purchaseOrdersNumber',
    header: 'Orden de Compra',
    cell: ({ row }) => {
      const data = row.original.purchaseOrdersNumber;
      if (data) {
        return data;
      }
      return `Sin OC`;
    },
  },

  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        SUPPLIER_INVOICE_STATUS_TYPES[
          status as keyof typeof SUPPLIER_INVOICE_STATUS_TYPES
        ] || status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'DRAFT':
            return 'default';
          case 'PENDING':
            return 'secondary';
          case 'ACCOUNTED_FOR':
            return 'warning';
          case 'PAID':
            return 'success';
          case 'CANCELLED':
            return 'destructive';
          default:
            return 'outline';
        }
      })();

      return (
        <Badge
          variant={
            variant as
              | 'default'
              | 'destructive'
              | 'outline'
              | 'secondary'
              | 'success'
              | 'danger'
          }
        >
          {statusText}
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
