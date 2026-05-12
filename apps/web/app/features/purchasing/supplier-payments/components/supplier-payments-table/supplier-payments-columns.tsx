import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import type { SupplierPaymentApi } from '../../schemas/supplier-payment-api.schema';
import { PAYMENT_STATUS_LABELS } from '../../schemas/supplier-payment-options';
import type { PaymentStatus } from '../../schemas/supplier-payment-options';
import { SupplierPaymentsCellAction } from './supplier-payments-cell-action';

const statusVariant = (status: string) => {
  const map: Record<string, 'default' | 'secondary' | 'success' | 'destructive' | 'outline'> = {
    COMPLETED: 'success',
    PENDING: 'secondary',
    REVERSED: 'destructive',
    CANCELLED: 'outline',
  };
  return map[status] ?? 'default';
};

export const supplierPaymentsColumns: ColumnDef<SupplierPaymentApi>[] = [
  {
    accessorKey: 'supplierName',
    header: 'Proveedor',
  },
  {
    accessorKey: 'paymentDescription',
    header: 'Descripción',
  },
  {
    accessorKey: 'amount',
    header: 'Monto',
    cell: ({ row }) =>
      new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: row.original.currencyCode === 'USD' ? 'USD' : 'VES',
      }).format(row.original.amount),
  },
  {
    accessorKey: 'currencyCode',
    header: 'Moneda',
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Método',
  },
  {
    accessorKey: 'bankReference',
    header: 'Ref. Bancaria',
    cell: ({ row }) => row.original.bankReference || '—',
  },
  {
    accessorKey: 'transactionDate',
    header: 'Fecha',
    cell: ({ row }) => {
      try {
        return format(new Date(row.original.transactionDate), 'dd/MM/yyyy');
      } catch {
        return row.original.transactionDate;
      }
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status as PaymentStatus;
      return (
        <Badge variant={statusVariant(status)}>
          {PAYMENT_STATUS_LABELS[status] ?? status}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <SupplierPaymentsCellAction data={row.original} />
      </div>
    ),
  },
];
