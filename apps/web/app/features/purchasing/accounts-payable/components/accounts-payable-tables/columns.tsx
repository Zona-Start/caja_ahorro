import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@repo/shadcn/badge';
import { formatCurrency } from '@/lib/format-utils';
import { format } from 'date-fns';
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
} from '../../schemas/accounts-payable-options';
import type { AccountsPayableApi } from '../../schemas/accounts-payable-api.schema';
import { CellAction } from './cell-action';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  AUTHORIZED: 'default',
  PAID: 'outline',
  CANCELLED: 'destructive',
};

const priorityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  HIGH: 'destructive',
  MEDIUM: 'default',
  LOW: 'secondary',
};

export const accountsPayableColumns: ColumnDef<AccountsPayableApi>[] = [
  {
    accessorKey: 'invoiceNumber',
    header: 'N° Factura',
  },
  {
    accessorKey: 'supplierName',
    header: 'Proveedor',
  },
  {
    accessorKey: 'supplierTaxId',
    header: 'RIF',
  },
  {
    accessorKey: 'originalAmount',
    header: 'Monto Original',
    cell: ({ row }) => {
      const value = row.original.originalAmount;
      const currency = row.original.currencyCode as 'VES' | 'USD';
      return value != null ? formatCurrency(value, currency) : '-';
    },
  },
  {
    accessorKey: 'paidAmount',
    header: 'Monto Pagado',
    cell: ({ row }) => {
      const value = row.original.paidAmount;
      const currency = row.original.currencyCode as 'VES' | 'USD';
      return value != null ? formatCurrency(value, currency) : '-';
    },
  },
  {
    accessorKey: 'remainingAmount',
    header: 'Saldo Pendiente',
    cell: ({ row }) => {
      const value = row.original.remainingAmount;
      const currency = row.original.currencyCode as 'VES' | 'USD';
      return value != null ? formatCurrency(value, currency) : '-';
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      const label =
        STATUS_OPTIONS[value as keyof typeof STATUS_OPTIONS] || value;
      return (
        <Badge variant={statusVariant[value] || 'secondary'}>{label}</Badge>
      );
    },
  },
  {
    accessorKey: 'dueDate',
    header: 'Vencimiento',
    cell: ({ getValue }) => {
      const value = getValue();
      return value
        ? format(new Date(value as string), 'dd/MM/yyyy')
        : '-';
    },
  },
  {
    accessorKey: 'priority',
    header: 'Prioridad',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      const label =
        PRIORITY_OPTIONS[value as keyof typeof PRIORITY_OPTIONS] || value;
      return (
        <Badge variant={priorityVariant[value] || 'secondary'}>{label}</Badge>
      );
    },
  },
  {
    accessorKey: 'isAuthorizePayment',
    header: 'Autorizar Pago',
    cell: ({ getValue }) => {
      const value = getValue<boolean>();
      return value ? 'Sí' : 'No';
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
