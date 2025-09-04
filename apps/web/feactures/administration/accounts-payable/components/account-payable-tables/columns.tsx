'use client';

import { Badge } from '@repo/shadcn/badge';
import { ColumnDef } from '@tanstack/react-table';
import { AccountPayable, AccountPayableSchemaAPI } from '../../schemas';
import { ACCOUNT_PAYABLE_STATUS_TYPES } from '../../schemas/account-payable-options';
import { CellAction } from './cell-action';

export const columns: ColumnDef<AccountPayableSchemaAPI>[] = [
  {
    accessorKey: 'accountsPayableNumber',
    header: 'Referencia',
  },
  {
    accessorKey: 'supplierName',
    header: 'Proveedor',
  },
  {
    accessorKey: 'supplierInvoice.invoiceNumber',
    header: 'Factura',
  },
  {
    accessorKey: 'createdAt',
    header: 'Emisión',
  },
  {
    accessorKey: 'dueDate',
    header: 'Vencimiento',
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
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        ACCOUNT_PAYABLE_STATUS_TYPES[
          status as keyof typeof ACCOUNT_PAYABLE_STATUS_TYPES
        ] || status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'PAID':
            return 'success';
          case 'EXPIRED':
            return 'destructive';
          case 'IN_PROGRESS':
            return 'warning';
          case 'PENDING':
          case 'CANCELLED':
          default:
            return 'default';
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
    cell: ({ row }) => {
      const formattedData = {
        ...row.original,
        id: row.original.id || 0,
        accountsPayableNumber: row.original.accountsPayableNumber || '',
        createdAt: row.original.createdAt || '',
        dueDate: row.original.dueDate || '',
        originalAmount: row.original.originalAmount?.toString() || '',
        paidAmount: row.original.paidAmount?.toString() || '',
        remainingAmount: row.original.remainingAmount?.toString() || '',
        status: row.original.status || '',
      };

      const newFormat = {
        id: row.original.id,
        supplierInvoiceId: row.original.supplierInvoiceId,
        originalAmount: Number(row.original.originalAmount),
        paidAmount: Number(row.original.paidAmount),
        remainingAmount: Number(row.original.remainingAmount),
        status: row.original
          .status as keyof typeof ACCOUNT_PAYABLE_STATUS_TYPES,
        observations: row.original.observations,
        supplierInvoice: row.original.supplierInvoice,
      };
      return (
        <CellAction
          data={newFormat as AccountPayable}
          dataApi={formattedData}
        />
      );
    },
  },
];
