import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import type { SupplierInvoiceApi } from '../../schemas/supplier-invoice-api.schema';
import { INVOICE_STATUS_LABELS } from '../../schemas/supplier-invoice-options';
import type { InvoiceStatus } from '../../schemas/supplier-invoice-options';
import { SupplierInvoicesCellAction } from './supplier-invoices-cell-action';

const statusVariant = (status: string) => {
  const map: Record<string, 'default' | 'secondary' | 'success' | 'destructive' | 'outline' | 'warning'> = {
    DRAFT: 'secondary',
    APPROVED: 'default',
    PARTIALLY_PAID: 'warning',
    PAID: 'success',
    CANCELLED: 'destructive',
  };
  return map[status] ?? 'default';
};

export const supplierInvoicesColumns: ColumnDef<SupplierInvoiceApi>[] = [
  {
    accessorKey: 'invoiceNumber',
    header: 'N° Factura',
  },
  {
    accessorKey: 'controlNumber',
    header: 'N° Control',
    cell: ({ row }) => row.original.controlNumber || '—',
  },
  {
    id: 'supplierName',
    header: 'Proveedor',
    cell: ({ row }) => row.original.supplier?.name || '—',
  },
  {
    accessorKey: 'invoiceDate',
    header: 'Fecha Factura',
    cell: ({ row }) => {
      try {
        return format(new Date(row.original.invoiceDate), 'dd/MM/yyyy');
      } catch {
        return row.original.invoiceDate;
      }
    },
  },
  {
    accessorKey: 'dueDate',
    header: 'Vencimiento',
    cell: ({ row }) => {
      try {
        return format(new Date(row.original.dueDate), 'dd/MM/yyyy');
      } catch {
        return row.original.dueDate;
      }
    },
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
    cell: ({ row }) =>
      new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
      }).format(row.original.totalAmount),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status as InvoiceStatus;
      return (
        <Badge variant={statusVariant(status)}>
          {INVOICE_STATUS_LABELS[status] ?? status}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <SupplierInvoicesCellAction data={row.original} />
      </div>
    ),
  },
];
